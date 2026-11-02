
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
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

        currency: {
            type: String,
            default: "NGN",
            enum: ["NGN"]
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
            enum: [
                "pending",
                "successful",
                "failed",
                "review_required"
            ],
            default: "pending",
            index: true
        },

        failureReason: {
            type: String,
            default: null
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
