const express = require("express");
console.log("TRANSACTION ROUTES FILE LOADED");

const {
    createTransaction
} = require("../controllers/transactionController");

const Transaction = require("../models/transaction");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// CREATE TRANSACTION
// ========================================

router.post(
    "/create",
    authMiddleware,
    createTransaction
);


// ========================================
// GET LOGGED-IN USER'S TRANSACTIONS
// ========================================

router.get(
    "/my-transactions",
    authMiddleware,
    async (req, res) => {
        try {

            const transactions = await Transaction.find({
                user: req.user.id
            }).sort({ createdAt: -1 });

            res.json({
                success: true,
                message: "Transactions retrieved successfully.",
                count: transactions.length,
                data: transactions
            });

        } catch (error) {

            console.error(
                "Transaction history error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: "Unable to retrieve transactions."
            });

        }
    }
);


// ========================================
// EXPORT ROUTER
// ========================================

module.exports = router;