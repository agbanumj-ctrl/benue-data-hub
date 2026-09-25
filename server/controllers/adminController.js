const User = require("../models/user");
const Vendor = require("../models/vendor");
const Transaction = require("../models/transaction");

// ===============================
// ADMIN DASHBOARD STATISTICS
// ===============================

const getAdminDashboard = async (req, res) => {
    try {
        const [
            totalUsers,
            totalVendors,
            totalTransactions,
            activeAccounts,
            successfulTransactions,
            failedTransactions,
            walletFunding
        ] = await Promise.all([
            User.countDocuments({ role: "user" }),

            User.countDocuments({ role: "vendor" }),

            Transaction.countDocuments(),

            User.countDocuments({ isActive: true }),

            Transaction.countDocuments({
                status: "successful"
            }),

            Transaction.countDocuments({
                status: "failed"
            }),

            Transaction.aggregate([
                {
                    $match: {
                        service: "wallet-funding",
                        status: "successful"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }
                }
            ])
        ]);

        const totalWalletFunding =
            walletFunding.length > 0
                ? walletFunding[0].total
                : 0;

        res.json({
            success: true,
            statistics: {
                totalUsers,
                totalVendors,
                totalTransactions,
                activeAccounts,
                successfulTransactions,
                failedTransactions,
                totalWalletFunding
            }
        });

    } catch (error) {
        console.error(
            "Admin dashboard error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error while loading admin dashboard."
        });
    }
};


// ===============================
// GET ALL USERS
// ===============================

const getUsers = async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: ["user", "vendor"] }
        })
            .select(
                "name email phone role walletBalance isVerified isActive createdAt"
            )
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error(
            "Get users error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error while loading users."
        });
    }
};


// ===============================
// GET ALL VENDORS
// ===============================

const getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find()
            .populate(
                "user",
                "name email phone role walletBalance isActive isVerified"
            )
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: vendors.length,
            vendors
        });

    } catch (error) {
        console.error(
            "Get vendors error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error while loading vendors."
        });
    }
};


// ===============================
// GET ALL TRANSACTIONS
// ===============================

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate(
                "user",
                "name email phone role"
            )
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: transactions.length,
            transactions
        });

    } catch (error) {
        console.error(
            "Get admin transactions error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error while loading transactions."
        });
    }
};


// ===============================
// ACTIVATE / DEACTIVATE ACCOUNT
// ===============================

const updateAccountStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false."
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        if (user.role === "admin") {
            return res.status(400).json({
                success: false,
                message: "Admin accounts cannot be changed here."
            });
        }

        user.isActive = isActive;

        await user.save();

        res.json({
            success: true,
            message: isActive
                ? "Account activated successfully."
                : "Account deactivated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error(
            "Update account status error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error while updating account."
        });
    }
};


// ===============================
// VERIFY / UNVERIFY ACCOUNT
// ===============================

const updateVerificationStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isVerified } = req.body;

        if (typeof isVerified !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isVerified must be true or false."
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        user.isVerified = isVerified;

        await user.save();

        res.json({
            success: true,
            message: isVerified
                ? "Account verified successfully."
                : "Account verification removed.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error(
            "Verification update error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error while updating verification."
        });
    }
};


module.exports = {
    getAdminDashboard,
    getUsers,
    getVendors,
    getTransactions,
    updateAccountStatus,
    updateVerificationStatus
};