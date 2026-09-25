const User = require("../models/user");
const Vendor = require("../models/vendor");
const Transaction = require("../models/transaction");

// ===============================
// GET VENDOR PROFILE
// ===============================

const getVendorProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({
            user: req.user.id
        }).populate(
            "user",
            "name email phone role walletBalance isVerified isActive"
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor profile not found."
            });
        }

        res.json({
            success: true,
            vendor
        });

    } catch (error) {
        console.error("Get vendor profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while loading vendor profile."
        });
    }
};

// ===============================
// CREATE / UPDATE VENDOR PROFILE
// ===============================

const updateVendorProfile = async (req, res) => {
    try {
        const {
            businessName,
            businessPhone,
            businessAddress,
            businessDescription
        } = req.body;

        let vendor = await Vendor.findOne({
            user: req.user.id
        });

        if (!vendor) {
            vendor = await Vendor.create({
                user: req.user.id,
                businessName: businessName || "",
                businessPhone: businessPhone || "",
                businessAddress: businessAddress || "",
                businessDescription: businessDescription || ""
            });
        } else {
            vendor.businessName =
                businessName !== undefined
                    ? businessName
                    : vendor.businessName;

            vendor.businessPhone =
                businessPhone !== undefined
                    ? businessPhone
                    : vendor.businessPhone;

            vendor.businessAddress =
                businessAddress !== undefined
                    ? businessAddress
                    : vendor.businessAddress;

            vendor.businessDescription =
                businessDescription !== undefined
                    ? businessDescription
                    : vendor.businessDescription;

            await vendor.save();
        }

        res.json({
            success: true,
            message: "Vendor profile updated successfully.",
            vendor
        });

    } catch (error) {
        console.error("Update vendor profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while updating vendor profile."
        });
    }
};

// ===============================
// VENDOR DASHBOARD
// ===============================

const getVendorDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "name email phone role walletBalance isVerified isActive"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Vendor account not found."
            });
        }

        let vendor = await Vendor.findOne({
            user: req.user.id
        });

        if (!vendor) {
            vendor = await Vendor.create({
                user: req.user.id
            });
        }

        const transactions = await Transaction.find({
            user: req.user.id
        })
            .sort({ createdAt: -1 })
            .limit(20);

        const totalTransactions = await Transaction.countDocuments({
            user: req.user.id
        });

        const successfulTransactions = await Transaction.countDocuments({
            user: req.user.id,
            status: "successful"
        });

        res.json({
            success: true,

            user,

            vendor,

            statistics: {
                totalTransactions,
                successfulTransactions,
                totalSales: vendor.totalSales,
                totalCommission: vendor.totalCommission,
                customerCount: vendor.customerCount
            },

            transactions
        });

    } catch (error) {
        console.error("Vendor dashboard error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error while loading vendor dashboard."
        });
    }
};

module.exports = {
    getVendorProfile,
    updateVendorProfile,
    getVendorDashboard
};