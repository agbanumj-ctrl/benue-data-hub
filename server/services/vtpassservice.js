const axios = require("axios");

const VTPASS_BASE_URL = "https://sandbox.vtpass.com/api";

const getServiceCategories = async () => {
    try {
        const response = await axios.get(
            `${VTPASS_BASE_URL}/service-categories`,
            {
                headers: {
                    "api-key": process.env.VTPASS_API_KEY,
                    "public-key": process.env.VTPASS_PUBLIC_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "VTpass error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

const getAirtimeServices = async () => {
    try {
        const response = await axios.get(
            `${VTPASS_BASE_URL}/services?identifier=airtime`,
            {
                headers: {
                    "api-key": process.env.VTPASS_API_KEY,
                    "public-key": process.env.VTPASS_PUBLIC_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "VTpass airtime services error:",
            error.response?.data || error.message
        );

        throw error;
    }
};
const purchaseAirtime = async (serviceID, amount, phone, request_id) => {
    try {
        const response = await axios.post(
            `${VTPASS_BASE_URL}/pay`,
            {
                request_id,
                serviceID,
                amount,
                phone
            },
            {
                headers: {
                    "api-key": process.env.VTPASS_API_KEY,
                    "secret-key": process.env.VTPASS_SECRET_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("VTpass airtime purchase error:", error);

        throw error;
    }
};

module.exports = {
    getServiceCategories,
    getAirtimeServices,
    purchaseAirtime
};