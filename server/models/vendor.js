const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        businessName: {
            type: String,
            trim: true,
            default: ""
        },

        businessPhone: {
            type: String,
            trim: true,
            default: ""
        },

        businessAddress: {
            type: String,
            trim: true,
            default: ""
        },

        businessDescription: {
            type: String,
            trim: true,
            default: ""
        },

        totalSales: {
            type: Number,
            default: 0,
            min: 0
        },

        totalCommission: {
            type: Number,
            default: 0,
            min: 0
        },

        customerCount: {
            type: Number,
            default: 0,
            min: 0
        },

        isApproved: {
            type: Boolean,
            default: false
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Vendor", vendorSchema);