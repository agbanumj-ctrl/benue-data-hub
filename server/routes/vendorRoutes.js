const express = require("express");

const {
    getVendorProfile,
    updateVendorProfile,
    getVendorDashboard
} = require("../controllers/vendorController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// VENDOR DASHBOARD
// ===============================

router.get(
    "/dashboard",
    authMiddleware,
    requireRole("vendor"),
    getVendorDashboard
);

// ===============================
// VENDOR PROFILE
// ===============================

router.get(
    "/profile",
    authMiddleware,
    requireRole("vendor"),
    getVendorProfile
);

router.put(
    "/profile",
    authMiddleware,
    requireRole("vendor"),
    updateVendorProfile
);

module.exports = router;