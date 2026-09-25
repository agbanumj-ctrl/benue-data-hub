const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getServiceCategories,
    getAirtimeServices,
    getDataVariations,
    purchaseAirtime,
    purchaseData
} = require("../services/vtpassservice");

const User = require("../models/user");
const Transaction = require("../models/transaction");

const router = express.Router();


// ======================================================
// SERVICE CATEGORIES
// ======================================================

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


// ======================================================
// AIRTIME SERVICES
// ======================================================

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


// ======================================================
// DATA VARIATIONS / DATA PLANS
// ======================================================

router.get("/data-variations/:serviceID", async (req, res) => {
    try {
        const { serviceID } = req.params;

        if (!serviceID) {
            return res.status(400).json({
                success: false,
                message: "serviceID is required."
            });
        }

        const data = await getDataVariations(serviceID);

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error(
            "VTpass data variations error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to fetch data plans."
        });
    }
});


// ======================================================
// BUY AIRTIME
// ======================================================

router.post("/buy-airtime", authMiddleware, async (req, res) => {
    try {
        const {
            serviceID,
            amount,
            phone,
            request_id
        } = req.body;

        const purchaseAmount = Number(amount);

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

            return res.status(202).json({
                success: true,
                message:
                    "Transaction has been submitted and is awaiting confirmation.",
                transaction
            });
        }

        const vtpassTransaction =
            data.content?.transactions;

        transaction.transactionId =
            vtpassTransaction?.transactionId || null;

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
            message:
                "Airtime transaction failed. Your wallet has been refunded.",
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


// ======================================================
// BUY DATA
// ======================================================

router.post("/buy-data", authMiddleware, async (req, res) => {
    try {

        const {
            serviceID,
            variation_code,
            amount,
            phone,
            request_id
        } = req.body;

        const purchaseAmount = Number(amount);

        if (
            !serviceID ||
            !variation_code ||
            !Number.isFinite(purchaseAmount) ||
            purchaseAmount <= 0 ||
            !phone ||
            !request_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "serviceID, variation_code, valid amount, phone and request_id are required."
            });
        }

        // Prevent duplicate requests
        const existingTransaction = await Transaction.findOne({
            requestId: request_id
        });

        if (existingTransaction) {
            return res.status(409).json({
                success: false,
                message:
                    "This transaction request has already been processed.",
                transaction: existingTransaction
            });
        }

        // Debit wallet atomically
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

        // Create pending transaction
        let transaction;

        try {

            transaction = await Transaction.create({
                user: req.user.id,
                service: "data",
                serviceID,
                phone,
                amount: purchaseAmount,
                requestId: request_id,
                status: "pending",
                walletDebited: true,
                walletRefunded: false
            });

        } catch (transactionError) {

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

        // Send purchase to VTpass
        let data;

        try {

            data = await purchaseData(
                serviceID,
                variation_code,
                purchaseAmount,
                phone,
                request_id
            );

        } catch (vtpassError) {

            console.error(
                "VTpass data purchase error:",
                vtpassError.response?.data || vtpassError.message
            );

            return res.status(202).json({
                success: true,
                message:
                    "Data transaction has been submitted and is awaiting confirmation.",
                transaction
            });
        }

        const vtpassTransaction =
            data.content?.transactions;

        transaction.transactionId =
            vtpassTransaction?.transactionId || null;

        // Successful transaction
        if (data.code === "000") {

            transaction.status = "successful";

            await transaction.save();

            return res.status(200).json({
                success: true,
                message: "Data purchase successful.",
                data,
                transaction,
                walletBalance: user.walletBalance
            });
        }

        // Failed transaction — refund wallet
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
            message:
                "Data purchase failed. Your wallet has been refunded.",
            data,
            transaction,
            walletBalance: updatedUser.walletBalance
        });

    } catch (error) {

        console.error(
            "VTpass data purchase error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to process data transaction."
        });
    }
});


module.exports = router;