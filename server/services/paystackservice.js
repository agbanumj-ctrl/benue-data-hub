
const axios = require("axios");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// ========================================
// INITIALIZE PAYMENT
// ========================================

const initializePayment = async (email, amount, reference, callbackUrl) => {
    try {
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                email,
                amount: amount * 100,
                reference,
                callback_url: callbackUrl
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Paystack initialize error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

// ========================================
// VERIFY PAYMENT
// ========================================

const verifyPayment = async (reference) => {
    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Paystack verification error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

module.exports = {
    initializePayment,
    verifyPayment
};
