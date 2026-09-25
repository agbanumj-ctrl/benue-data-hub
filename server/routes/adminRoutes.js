const express = require("express");

const {
    getAdminDashboard,
    getUsers,
    getVendors,
    getTransactions,
    updateAccountStatus,
    updateVerificationStatus
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();


// Every route below requires ADMIN
router.use(authMiddleware);
router.use(requireRole("admin"));


// Dashboard statistics
router.get(
    "/dashboard",
    getAdminDashboard
);


// Users
router.get(
    "/users",
    getUsers
);


// Vendors
router.get(
    "/vendors",
    getVendors
);


// Transactions
router.get(
    "/transactions",
    getTransactions
);


// Activate / deactivate account
router.patch(
    "/users/:userId/status",
    updateAccountStatus
);


// Verify / unverify account
router.patch(
    "/users/:userId/verification",
    updateVerificationStatus
);


module.exports = router;