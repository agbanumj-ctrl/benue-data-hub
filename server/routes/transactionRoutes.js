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

// ========================================
// CREATE TRANSACTION TEST
// ========================================

router.post("/create", (req, res) => {
    console.log("CREATE TRANSACTION POST ROUTE HIT");

    res.json({
        success: true,
        message: "Transaction POST route is working!"
    });
});
// ========================================
// GET LOGGED-IN USER'S TRANSACTIONS
// ========================================

router.get("/my-transactions", authMiddleware, async (req, res) => {
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
});


module.exports = router;