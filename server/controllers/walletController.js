const User = require("../models/user");
const WalletTransaction = require("../models/walletTransaction");
const {
    initializePayment,
    verifyPayment
} = require("../services/paystackservice");

const fundWallet = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        const reference =
            "BDH-WALLET-" +
            Date.now() +
            "-" +
            user._id;

        const walletTransaction = await WalletTransaction.create({
            user: user._id,
            type: "credit",
            amount: amount,
            reference: reference,
            description: "Wallet funding",
            status: "pending"
        });

        const callbackUrl =
            process.env.PAYSTACK_CALLBACK_URL ||
            "http://localhost:3001/api/wallet/verify";

        const payment = await initializePayment(
            user.email,
            amount,
            reference,
            callbackUrl
        );

        if (!payment || !payment.status || !payment.data) {
            walletTransaction.status = "failed";
            await walletTransaction.save();

            return res.status(500).json({
                success: false,
                message: "Unable to initialize wallet funding."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet funding initialized.",
            authorization_url: payment.data.authorization_url,
            reference: reference
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


const verifyWalletFunding = async (req, res) => {
    try {
        // Paystack returns the reference as a query parameter
        const reference = req.query.reference;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: "Payment reference is required."
            });
        }

        const walletTransaction =
            await WalletTransaction.findOne({
                reference: reference
            });

        if (!walletTransaction) {
            return res.status(404).json({
                success: false,
                message: "Wallet transaction not found."
            });
        }

        // Prevent the same payment from being credited twice
        if (walletTransaction.status === "successful") {
            const existingUser =
                await User.findById(walletTransaction.user);

            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: "User account not found."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Wallet funding has already been processed.",
                walletBalance: existingUser.walletBalance
            });
        }

        const payment = await verifyPayment(reference);

        if (
            !payment ||
            !payment.status ||
            !payment.data ||
            payment.data.status !== "success"
        ) {
            walletTransaction.status = "failed";
            await walletTransaction.save();

            return res.status(400).json({
                success: false,
                message: "Payment was not successful."
            });
        }

        const paidAmount =
            Number(payment.data.amount) / 100;

        if (paidAmount !== walletTransaction.amount) {
            walletTransaction.status = "failed";
            await walletTransaction.save();

            return res.status(400).json({
                success: false,
                message:
                    "Payment amount does not match the wallet transaction."
            });
        }

        const user =
            await User.findById(walletTransaction.user);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        user.walletBalance =
            Number(user.walletBalance) + paidAmount;

        await user.save();

        walletTransaction.providerReference =
            payment.data.reference;

        walletTransaction.status = "successful";

        await walletTransaction.save();

        return res.status(200).json({
            success: true,
            message: "Wallet funded successfully.",
            walletBalance: user.walletBalance,
            transaction: walletTransaction
        });

    } catch (error) {
        console.error(
            "Wallet verification error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify wallet funding."
        });
    }
};


module.exports = {
    fundWallet,
    verifyWalletFunding
};