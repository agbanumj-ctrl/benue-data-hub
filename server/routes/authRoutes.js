const express = require("express");

const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/me", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Authentication verified successfully.",
        user: req.user
    });
});

module.exports = router;