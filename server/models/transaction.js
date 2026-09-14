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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);