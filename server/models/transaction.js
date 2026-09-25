const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        service: {
            type: String,
            required: true
        },

        serviceID: {
            type: String,
            required: true
        },

        variationCode: {
            type: String,
            default: null
        },

        phone: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        requestId: {
            type: String,
            required: true,
            unique: true
        },

        transactionId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ["pending", "successful", "failed"],
            default: "pending"
        },

        walletDebited: {
            type: Boolean,
            default: false
        },

        walletRefunded: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);