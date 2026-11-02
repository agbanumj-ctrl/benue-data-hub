
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/user");
const WalletTransaction = require("../models/walletTransaction");

const {
    initializePayment,
    verifyPayment
} = require("../services/paystackservice");


// ========================================
// FUND WALLET
// ========================================

const fundWallet = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            !Number.isInteger(amount * 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount with no more than two decimal places."
            });
        }

        const amountInKobo = Math.round(amount * 100);

        if (!Number.isSafeInteger(amountInKobo)) {
            return res.status(400).json({
                success: false,
                message: "Invalid funding amount."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        const callbackUrl =
            process.env.PAYSTACK_CALLBACK_URL;

        if (!callbackUrl) {
            return res.status(500).json({
                success: false,
                message: "Payment callback URL is not configured."
            });
        }

        let parsedCallbackUrl;

        try {
            parsedCallbackUrl = new URL(callbackUrl);
        } catch {
            return res.status(500).json({
                success: false,
                message: "Payment callback URL is invalid."
            });
        }

        if (
            process.env.NODE_ENV === "production" &&
            parsedCallbackUrl.protocol !== "https:"
        ) {
            return res.status(500).json({
                success: false,
                message: "Production payment callback must use HTTPS."
            });
        }

        // Generate a difficult-to-guess payment reference.
        const reference =
            "BDH-WALLET-" +
            Date.now() +
            "-" +
            crypto.randomBytes(16).toString("hex");

        const walletTransaction =
            await WalletTransaction.create({
                user: user._id,
                type: "credit",
                amount,
                currency: "NGN",
                reference,
                description: "Wallet funding",
                status: "pending"
            });

        let payment;

        try {
            payment = await initializePayment(
                user.email,
                amount,
                reference,
                callbackUrl
            );
        } catch (error) {
            walletTransaction.status = "failed";
            walletTransaction.failureReason =
                "Paystack payment initialization failed.";

            await walletTransaction.save();

            throw error;
        }

        if (
            !payment ||
            payment.status !== true ||
            !payment.data?.authorization_url
        ) {
            walletTransaction.status = "failed";
            walletTransaction.failureReason =
                "Paystack did not return a valid authorization URL.";

            await walletTransaction.save();

            return res.status(502).json({
                success: false,
                message: "Unable to initialize wallet funding."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet funding initialized.",
            authorization_url: payment.data.authorization_url,
            reference
        });

    } catch (error) {
        console.error(
            "Wallet funding error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to initialize wallet funding."
        });
    }
};


// ========================================
// VERIFY WALLET FUNDING
// ========================================

const verifyWalletFunding = async (req, res) => {
    try {
        const reference = req.query.reference;

        if (
            typeof reference !== "string" ||
            !reference.startsWith("BDH-WALLET-")
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid payment reference is required."
            });
        }

        const walletTransaction =
            await WalletTransaction.findOne({ reference });

        if (!walletTransaction) {
            return res.status(404).json({
                success: false,
                message: "Wallet transaction not found."
            });
        }

        // An already successful payment must never be credited again.
        if (walletTransaction.status === "successful") {
            const existingUser = await User.findById(
                walletTransaction.user
            );

            return res.status(200).json({
                success: true,
                message: "Wallet funding has already been processed.",
                walletBalance: Number(
                    existingUser?.walletBalance || 0
                )
            });
        }

        if (walletTransaction.status === "review_required") {
            return res.status(409).json({
                success: false,
                message: "This payment requires manual review."
            });
        }

        if (walletTransaction.status === "failed") {
            return res.status(400).json({
                success: false,
                message: "This payment was previously marked as failed."
            });
        }

        // Ask Paystack directly. Never trust the browser callback alone.
        let payment;

        try {
            payment = await verifyPayment(reference);
        } catch (error) {
            console.error(
                "Paystack verification request failed:",
                error.response?.data || error.message
            );

            // Keep the transaction pending if Paystack cannot be reached.
            return res.status(502).json({
                success: false,
                message: "Payment verification is temporarily unavailable. Please try again."
            });
        }

        if (
            !payment ||
            payment.status !== true ||
            !payment.data
        ) {
            return res.status(502).json({
                success: false,
                message: "Paystack returned an invalid verification response."
            });
        }

        const paidData = payment.data;

        if (paidData.status !== "success") {
            if (paidData.status === "failed") {
                await WalletTransaction.updateOne(
                    {
                        _id: walletTransaction._id,
                        status: "pending"
                    },
                    {
                        $set: {
                            status: "failed",
                            failureReason: "Paystack reported that payment failed."
                        }
                    }
                );
            }

            return res.status(400).json({
                success: false,
                message: "Paystack has not confirmed a successful payment."
            });
        }

        const paidAmountInKobo = Number(paidData.amount);
        const expectedAmountInKobo = Math.round(
            walletTransaction.amount * 100
        );

        // A confirmed but mismatched payment must be investigated.
        if (
            !Number.isSafeInteger(paidAmountInKobo) ||
            paidAmountInKobo !== expectedAmountInKobo ||
            paidData.currency !== "NGN" ||
            paidData.reference !== reference
        ) {
            await WalletTransaction.updateOne(
                {
                    _id: walletTransaction._id,
                    status: "pending"
                },
                {
                    $set: {
                        status: "review_required",
                        providerReference: paidData.reference || null,
                        failureReason: "Verified payment details do not match the wallet transaction."
                    }
                }
            );

            return res.status(409).json({
                success: false,
                message: "Payment details require manual review. Your wallet has not been credited."
            });
        }

        const user = await User.findById(
            walletTransaction.user
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Wallet owner account not found. Payment requires review."
            });
        }

        const paidEmail = paidData.customer?.email;

        if (
            !paidEmail ||
            paidEmail.toLowerCase() !== user.email.toLowerCase()
        ) {
            await WalletTransaction.updateOne(
                {
                    _id: walletTransaction._id,
                    status: "pending"
                },
                {
                    $set: {
                        status: "review_required",
                        providerReference: paidData.reference,
                        failureReason: "Paystack customer email does not match the wallet owner."
                    }
                }
            );

            return res.status(409).json({
                success: false,
                message: "Payment customer details require manual review."
            });
        }

        // Atomically mark the payment successful and credit the wallet.
        const session = await mongoose.startSession();

        let finalWalletBalance = null;
        let alreadyProcessed = false;

        try {
            await session.withTransaction(async () => {
                alreadyProcessed = false;
                finalWalletBalance = null;

                const claimedTransaction =
                    await WalletTransaction.findOneAndUpdate(
                        {
                            _id: walletTransaction._id,
                            status: "pending"
                        },
                        {
                            $set: {
                                status: "successful",
                                providerReference: paidData.reference,
                                failureReason: null
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                // Another verification request may have processed it first.
                if (!claimedTransaction) {
                    const currentTransaction =
                        await WalletTransaction.findById(
                            walletTransaction._id
                        ).session(session);

                    if (currentTransaction?.status === "successful") {
                        alreadyProcessed = true;

                        const existingUser =
                            await User.findById(
                                walletTransaction.user
                            ).session(session);

                        finalWalletBalance = Number(
                            existingUser?.walletBalance || 0
                        );

                        return;
                    }

                    throw new Error(
                        "Wallet transaction is no longer pending."
                    );
                }

                const updatedUser =
                    await User.findByIdAndUpdate(
                        walletTransaction.user,
                        {
                            $inc: {
                                walletBalance: walletTransaction.amount
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                if (!updatedUser) {
                    throw new Error(
                        "Wallet owner could not be updated."
                    );
                }

                finalWalletBalance = Number(
                    updatedUser.walletBalance
                );
            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: alreadyProcessed
                ? "Wallet funding has already been processed."
                : "Wallet funded successfully.",
            walletBalance: finalWalletBalance
        });

    } catch (error) {
        console.error(
            "Wallet verification error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to complete wallet verification. Please contact support if payment was deducted."
        });
    }
};


module.exports = {
    fundWallet,
    verifyWalletFunding
};
