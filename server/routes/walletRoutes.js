const express = require("express");

const router = express.Router();

const {
    fundWallet,
    verifyWalletFunding
} = require("../controllers/walletController");

const authMiddleware = require("../middleware/authMiddleware");

// Fund wallet
router.post("/fund", authMiddleware, fundWallet);

// Get current wallet balance
router.get("/balance", authMiddleware, async (req, res) => {
    try {
        const User = require("../models/user");

        const user = await User.findById(req.user.id).select(
            "walletBalance"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        return res.status(200).json({
            success: true,
            walletBalance: Number(user.walletBalance || 0)
        });

    } catch (error) {
        console.error(
            "Wallet balance error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve wallet balance."
        });
    }
});

// Verify Paystack payment
router.get("/verify", verifyWalletFunding);

module.exports = router;