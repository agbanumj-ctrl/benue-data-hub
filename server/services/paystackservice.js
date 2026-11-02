
const axios = require("axios");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const getHeaders = () => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    return {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
    };
};


// ========================================
// INITIALIZE PAYMENT
// ========================================

const initializePayment = async (
    email,
    amount,
    reference,
    callbackUrl
) => {
    const amountInKobo = Math.round(Number(amount) * 100);

    if (
        !email ||
        !Number.isSafeInteger(amountInKobo) ||
        amountInKobo <= 0 ||
        !reference ||
        !callbackUrl
    ) {
        throw new Error("Invalid Paystack initialization details.");
    }

    try {
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                email,
                amount: amountInKobo,
                currency: "NGN",
                reference,
                callback_url: callbackUrl
            },
            {
                headers: getHeaders(),
                timeout: 20000
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "Paystack initialization failed:",
            error.response?.data?.message || error.message
        );

        throw error;
    }
};


// ========================================
// VERIFY PAYMENT
// ========================================

const verifyPayment = async (reference) => {
    if (
        typeof reference !== "string" ||
        !reference.trim()
    ) {
        throw new Error("A valid payment reference is required.");
    }

    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: getHeaders(),
                timeout: 20000
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "Paystack verification failed:",
            error.response?.data?.message || error.message
        );

        throw error;
    }
};


module.exports = {
    initializePayment,
    verifyPayment
};
