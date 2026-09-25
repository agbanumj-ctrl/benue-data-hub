const User = require("../models/user");
const Transaction = require("../models/transaction");
const {
    purchaseAirtime
} = require("../services/vtpassservice");


// ========================================
// CREATE AIRTIME TRANSACTION
// ========================================

const createTransaction = async (req, res) => {

    let transaction = null;

    try {

        const {
            service,
            serviceID,
            phone,
            amount,
            requestId
        } = req.body;


        // ========================================
        // VALIDATION
        // ========================================

        if (
            !service ||
            !serviceID ||
            !phone ||
            !amount ||
            !requestId
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Service, serviceID, phone, amount and requestId are required."
            });
        }


        const purchaseAmount =
            Number(amount);


        if (
            !Number.isFinite(purchaseAmount) ||
            purchaseAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction amount."
            });
        }


        // ========================================
        // FIND USER
        // ========================================

        const user =
            await User.findById(req.user.id);


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }


        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive."
            });
        }


        // ========================================
        // CHECK DUPLICATE REQUEST
        // ========================================

        const existingTransaction =
            await Transaction.findOne({
                requestId
            });


        if (existingTransaction) {

            return res.status(409).json({
                success: false,
                message:
                    "This transaction request has already been processed.",
                transaction:
                    existingTransaction,
                walletBalance:
                    user.walletBalance
            });
        }


        // ========================================
        // CHECK WALLET BALANCE
        // ========================================

        if (
            Number(user.walletBalance) <
            purchaseAmount
        ) {

            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance.",
                walletBalance:
                    user.walletBalance
            });
        }


        // ========================================
        // ATOMIC WALLET DEBIT
        // ========================================

        const updatedUser =
            await User.findOneAndUpdate(
                {
                    _id: req.user.id,
                    walletBalance: {
                        $gte: purchaseAmount
                    }
                },
                {
                    $inc: {
                        walletBalance:
                            -purchaseAmount
                    }
                },
                {
                    new: true
                }
            );


        if (!updatedUser) {

            return res.status(400).json({
                success: false,
                message:
                    "Unable to debit wallet. Please try again."
            });
        }


        // ========================================
        // CREATE PENDING TRANSACTION
        // ========================================

        try {

            transaction =
                await Transaction.create({
                    user: req.user.id,

                    service,

                    serviceID,

                    phone,

                    amount:
                        purchaseAmount,

                    requestId,

                    transactionId:
                        null,

                    status:
                        "pending",

                    walletDebited:
                        true,

                    walletRefunded:
                        false
                });

        } catch (transactionError) {

            // ========================================
            // REFUND IF TRANSACTION RECORD FAILED
            // ========================================

            await User.findByIdAndUpdate(
                req.user.id,
                {
                    $inc: {
                        walletBalance:
                            purchaseAmount
                    }
                }
            );

            console.error(
                "Transaction creation error:",
                transactionError.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to create transaction."
            });
        }


        // ========================================
        // SEND AIRTIME REQUEST TO VTPASS
        // ========================================

        let vtpassResponse;

        try {

            vtpassResponse =
                await purchaseAirtime(
                    serviceID,
                    purchaseAmount,
                    phone,
                    requestId
                );

        } catch (vtpassError) {

            console.error(
                "VTpass Airtime request error:",
                vtpassError.response?.data ||
                vtpassError.message
            );


            // ========================================
            // UNKNOWN VTPASS RESULT
            // KEEP TRANSACTION PENDING
            // ========================================

            transaction.status =
                "pending";

            await transaction.save();


            const currentUser =
                await User.findById(
                    req.user.id
                );


            return res.status(202).json({
                success: false,
                pending: true,
                message:
                    "Your airtime request is still being processed.",
                transaction,
                walletBalance:
                    currentUser?.walletBalance ??
                    updatedUser.walletBalance
            });
        }


        console.log(
            "VTPASS AIRTIME FINAL RESPONSE:",
            JSON.stringify(
                vtpassResponse,
                null,
                2
            )
        );


        // ========================================
        // CHECK VTPASS RESULT
        // ========================================

        const vtpassCode =
            String(
                vtpassResponse?.code ||
                ""
            );


        // ========================================
        // SUCCESS
        // ========================================

        if (vtpassCode === "000") {

            transaction.status =
                "successful";


            transaction.transactionId =
                vtpassResponse
                    ?.content
                    ?.transactions
                    ?.transactionId ||
                vtpassResponse
                    ?.content
                    ?.transactions
                    ?.transaction_id ||
                vtpassResponse
                    ?.content
                    ?.transactionId ||
                null;


            await transaction.save();


            const finalUser =
                await User.findById(
                    req.user.id
                );


            return res.json({
                success: true,
                message:
                    "Airtime purchase successful.",
                transaction,
                walletBalance:
                    finalUser?.walletBalance ??
                    updatedUser.walletBalance
            });
        }


        // ========================================
        // CONFIRMED FAILURE
        // REFUND CUSTOMER
        // ========================================

        transaction.status =
            "failed";


        if (
            !transaction.walletRefunded
        ) {

            await User.findByIdAndUpdate(
                req.user.id,
                {
                    $inc: {
                        walletBalance:
                            purchaseAmount
                    }
                }
            );


            transaction.walletRefunded =
                true;
        }


        await transaction.save();


        const refundedUser =
            await User.findById(
                req.user.id
            );


        return res.status(400).json({
            success: false,
            message:
                vtpassResponse
                    ?.response_description ||
                vtpassResponse
                    ?.message ||
                "Airtime purchase failed.",

            transaction,

            walletBalance:
                refundedUser?.walletBalance ??
                0
        });


    } catch (error) {

        console.error(
            "Create transaction error:",
            error.response?.data ||
            error.message
        );


        // ========================================
        // SAFETY NET
        // ========================================

        if (
            transaction &&
            transaction.walletDebited &&
            !transaction.walletRefunded
        ) {

            try {

                transaction.status =
                    "pending";

                await transaction.save();

            } catch (saveError) {

                console.error(
                    "Unable to save pending transaction:",
                    saveError.message
                );
            }
        }


        return res.status(500).json({
            success: false,
            message:
                "Unable to process airtime transaction."
        });
    }
};


module.exports = {
    createTransaction
};