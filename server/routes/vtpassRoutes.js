const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getServiceCategories,
    getAirtimeServices,
    purchaseAirtime
} = require("../services/vtpassservice");

const User = require("../models/user");
const Transaction = require("../models/transaction");

const router = express.Router();

router.get("/service-categories", async (req, res) => {
    try {
        const data = await getServiceCategories();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error(
            "VTpass service categories error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to fetch VTpass service categories."
        });
    }
});

router.get("/airtime-services", async (req, res) => {
    try {
        const data = await getAirtimeServices();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error(
            "VTpass airtime services error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to fetch VTpass airtime services."
        });
    }
});

router.post("/buy-airtime", authMiddleware, async (req, res) => {
    try {
        const {
            serviceID,
            amount,
            phone,
            request_id
        } = req.body;

        const purchaseAmount = Number(amount);

        // 1. Validate request
        if (
            !serviceID ||
            !Number.isFinite(purchaseAmount) ||
            purchaseAmount <= 0 ||
            !phone ||
            !request_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "serviceID, valid amount, phone and request_id are required."
            });
        }

        // 2. Prevent duplicate request IDs
        const existingTransaction = await Transaction.findOne({
            requestId: request_id
        });

        if (existingTransaction) {
            return res.status(409).json({
                success: false,
                message: "This transaction request has already been processed.",
                transaction: existingTransaction
            });
        }

        // 3. Atomically debit the user's wallet
        // Only succeeds when the user has enough balance.
        const user = await User.findOneAndUpdate(
            {
                _id: req.user.id,
                walletBalance: {
                    $gte: purchaseAmount
                }
            },
            {
                $inc: {
                    walletBalance: -purchaseAmount
                }
            },
            {
                new: true
            }
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance."
            });
        }

        // 4. Create transaction after wallet debit
        let transaction;

        try {
            transaction = await Transaction.create({
                user: req.user.id,
                service: "airtime",
                serviceID,
                phone,
                amount: purchaseAmount,
                requestId: request_id,
                status: "pending",
                walletDebited: true,
                walletRefunded: false
            });
        } catch (transactionError) {
            // If transaction creation fails, return the money
            // to the user's wallet.
            await User.findByIdAndUpdate(
                req.user.id,
                {
                    $inc: {
                        walletBalance: purchaseAmount
                    }
                }
            );

            throw transactionError;
        }

        // 5. Send transaction to VTpass
        let data;

        try {
            data = await purchaseAirtime(
                serviceID,
                purchaseAmount,
                phone,
                request_id
            );
        } catch (vtpassError) {
            console.error(
                "VTpass airtime purchase error:",
                vtpassError.response?.data || vtpassError.message
            );

            // IMPORTANT:
            // We do not automatically refund here because the request
            // may have reached VTpass even if our server did not receive
            // the response. The transaction remains pending for
            // reconciliation.
            return res.status(202).json({
                success: true,
                message:
                    "Transaction has been submitted and is awaiting confirmation.",
                transaction
            });
        }

        const vtpassTransaction =
            data.content?.transactions;

        // 6. Save VTpass transaction ID
        transaction.transactionId =
            vtpassTransaction?.transactionId || null;

        // 7. Determine result
        if (data.code === "000") {
            transaction.status = "successful";

            await transaction.save();

            return res.status(200).json({
                success: true,
                message: "Airtime transaction successful.",
                data,
                transaction,
                walletBalance: user.walletBalance
            });
        }

        // 8. If VTpass reports failure, refund the wallet
        transaction.status = "failed";

        if (!transaction.walletRefunded) {
            await User.findByIdAndUpdate(
                req.user.id,
                {
                    $inc: {
                        walletBalance: purchaseAmount
                    }
                }
            );

            transaction.walletRefunded = true;
        }

        await transaction.save();

        const updatedUser = await User.findById(req.user.id)
            .select("walletBalance");

        return res.status(400).json({
            success: false,
            message: "Airtime transaction failed. Your wallet has been refunded.",
            data,
            transaction,
            walletBalance: updatedUser.walletBalance
        });

    } catch (error) {
        console.error(
            "VTpass airtime purchase error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to process airtime transaction."
        });
    }
});

module.exports = router;