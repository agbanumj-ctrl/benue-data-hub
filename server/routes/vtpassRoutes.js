const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getServiceCategories,
    getAirtimeServices,
    purchaseAirtime
} = require("../services/vtpassservice");

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
        res.status(500).json({
            success: false,
            message: "Unable to fetch VTpass airtime services."
        });
    }
});

router.post("/buy-airtime", authMiddleware, async (req, res) => {
    try {
        const { serviceID, amount, phone, request_id } = req.body;

        if (!serviceID || !amount || !phone || !request_id) {
            return res.status(400).json({
                success: false,
                message: "serviceID, amount, phone and request_id are required."
            });
        }

        // 1. Create transaction as pending
        const transaction = await Transaction.create({
            user: req.user.id,
            service: "airtime",
            serviceID,
            phone,
            amount,
            requestId: request_id,
            status: "pending"
        });

        // 2. Send transaction to VTpass
        const data = await purchaseAirtime(
            serviceID,
            amount,
            phone,
            request_id
        );

        const vtpassTransaction = data.content?.transactions;

        // 3. Determine transaction status
        let status = "failed";

        if (data.code === "000") {
            status = "successful";
        }

        // 4. Update MongoDB transaction
        transaction.transactionId =
            vtpassTransaction?.transactionId || null;

        transaction.status = status;

        await transaction.save();

        // 5. Return result
        res.json({
            success: true,
            message: "Airtime transaction processed.",
            data,
            transaction
        });

    } catch (error) {
        console.error(
            "VTpass airtime purchase error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to process airtime transaction."
        });
    }
});

module.exports = router;