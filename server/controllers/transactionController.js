const Transaction = require("../models/transaction");
const User = require("../models/user");
const WalletTransaction = require("../models/walletTransaction");
const { purchaseAirtime } = require("../services/vtpassservice");

const createTransaction = async (req, res) => {
    try {
        const {
            service,
            serviceID,
            phone,
            amount,
            requestId
        } = req.body;

        const purchaseAmount = Number(amount);

        // ========================================
        // 1. VALIDATE TRANSACTION DATA
        // ========================================

        if (
            !service ||
            !serviceID ||
            !phone ||
            !requestId ||
            !Number.isFinite(purchaseAmount) ||
            purchaseAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "All transaction fields are required."
            });
        }

        // ========================================
        // 2. CHECK USER
        // ========================================

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        // ========================================
        // 3. CHECK FOR DUPLICATE REQUEST
        // ========================================

        const existingTransaction =
            await Transaction.findOne({
                requestId: requestId
            });

        if (existingTransaction) {
            return res.status(409).json({
                success: false,
                message: "This transaction request has already been processed.",
                data: existingTransaction
            });
        }

        // ========================================
        // 4. CHECK WALLET BALANCE
        // ========================================

        const currentBalance = Number(user.walletBalance);

        if (currentBalance < purchaseAmount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance.",
                walletBalance: currentBalance,
                requiredAmount: purchaseAmount
            });
        }

        // ========================================
        // 5. DEBIT WALLET
        // ========================================

        user.walletBalance =
            currentBalance - purchaseAmount;

        await user.save();

        // ========================================
        // 6. RECORD WALLET DEBIT
        // ========================================

        const walletDebitReference =
            "BDH-DEBIT-" +
            Date.now() +
            "-" +
            requestId;

        const walletDebit =
            await WalletTransaction.create({
                user: user._id,
                type: "debit",
                amount: purchaseAmount,
                reference: walletDebitReference,
                description:
                    "Airtime purchase - " +
                    serviceID +
                    " - " +
                    phone,
                status: "successful"
            });

        // ========================================
        // 7. CREATE AIRTIME TRANSACTION
        // ========================================

        const transaction = await Transaction.create({
            user: user._id,
            service,
            serviceID,
            phone,
            amount: purchaseAmount,
            requestId,
            status: "pending"
        });

        // ========================================
        // 8. SEND PURCHASE TO VTPASS
        // ========================================

        let vtpassResponse;

        try {
            vtpassResponse = await purchaseAirtime(
                serviceID,
                purchaseAmount,
                phone,
                requestId
            );
        } catch (vtpassError) {

            console.error(
                "VTpass purchase error:",
                vtpassError.response?.data ||
                vtpassError.message
            );

            // ========================================
            // 9. REFUND WALLET IF VTPASS FAILS
            // ========================================

            user.walletBalance =
                Number(user.walletBalance) +
                purchaseAmount;

            await user.save();

            await WalletTransaction.create({
                user: user._id,
                type: "refund",
                amount: purchaseAmount,
                reference:
                    "BDH-REFUND-" +
                    Date.now() +
                    "-" +
                    requestId,
                description:
                    "Refund for failed airtime purchase - " +
                    requestId,
                status: "successful"
            });

            transaction.status = "failed";

            await transaction.save();

            return res.status(502).json({
                success: false,
                message:
                    "Airtime purchase failed. Your wallet has been refunded.",
                walletBalance: user.walletBalance,
                data: transaction
            });
        }

        // ========================================
        // 10. GET VTPASS TRANSACTION DETAILS
        // ========================================

        const vtpassTransactionId =
            vtpassResponse?.content?.transactions?.transactionId ||
            vtpassResponse?.content?.transactionId ||
            null;

        const vtpassStatus =
            vtpassResponse?.code === "000" ||
            vtpassResponse?.content?.transactions?.status === "delivered"
                ? "successful"
                : "failed";

        // ========================================
        // 11. HANDLE VTPASS RESULT
        // ========================================

        transaction.transactionId =
            vtpassTransactionId;

        transaction.status =
            vtpassStatus;

        await transaction.save();

        // ========================================
        // 12. REFUND IF VTPASS RETURNS FAILURE
        // ========================================

        if (vtpassStatus === "failed") {

            user.walletBalance =
                Number(user.walletBalance) +
                purchaseAmount;

            await user.save();

            await WalletTransaction.create({
                user: user._id,
                type: "refund",
                amount: purchaseAmount,
                reference:
                    "BDH-REFUND-" +
                    Date.now() +
                    "-" +
                    requestId,
                description:
                    "Refund for failed airtime purchase - " +
                    requestId,
                status: "successful"
            });

            return res.status(400).json({
                success: false,
                message:
                    "Airtime purchase failed. Your wallet has been refunded.",
                walletBalance: user.walletBalance,
                data: transaction,
                vtpass: vtpassResponse
            });
        }

        // ========================================
        // 13. SUCCESSFUL PURCHASE
        // ========================================

        return res.status(200).json({
            success: true,
            message: "Airtime purchase successful.",
            walletBalance: user.walletBalance,
            data: transaction,
            vtpass: vtpassResponse
        });

    } catch (error) {

        console.error(
            "Transaction creation error:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to process airtime transaction."
        });
    }
};


// ========================================
// UPDATE TRANSACTION
// ========================================

const updateTransaction = async (
    requestId,
    transactionId,
    status
) => {

    const transaction =
        await Transaction.findOneAndUpdate(
            { requestId },
            {
                transactionId,
                status
            },
            { new: true }
        );

    return transaction;
};


module.exports = {
    createTransaction,
    updateTransaction
};