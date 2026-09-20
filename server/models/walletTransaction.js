
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["credit", "debit", "refund"],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        reference: {
            type: String,
            required: true,
            unique: true
        },

        providerReference: {
            type: String,
            default: null
        },

        description: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "successful", "failed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "WalletTransaction",
    walletTransactionSchema
);
