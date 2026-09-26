const axios = require("axios");

const VTPASS_BASE_URL = "https://sandbox.vtpass.com/api";

const getHeaders = () => ({
    "api-key": process.env.VTPASS_API_KEY,
    "public-key": process.env.VTPASS_PUBLIC_KEY,
    "Content-Type": "application/json"
});

const getPostHeaders = () => ({
    "api-key": process.env.VTPASS_API_KEY,
    "secret-key": process.env.VTPASS_SECRET_KEY,
    "Content-Type": "application/json"
});


// ======================================================
// SERVICE CATEGORIES
// ======================================================

const getServiceCategories = async () => {
    try {
        const response = await axios.get(
            `${VTPASS_BASE_URL}/service-categories`,
            {
                headers: getHeaders()
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "VTpass service categories error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// AIRTIME SERVICES
// ======================================================

const getAirtimeServices = async () => {
    try {
        const response = await axios.get(
            `${VTPASS_BASE_URL}/services?identifier=airtime`,
            {
                headers: getHeaders()
            }
        );

        console.log(
            "VTPASS AIRTIME SERVICES RESPONSE:",
            JSON.stringify(response.data, null, 2)
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


// ======================================================
// DATA VARIATIONS
// ======================================================

const getDataVariations = async (serviceID) => {
    try {
        const response = await axios.get(
            `${VTPASS_BASE_URL}/service-variations`,
            {
                params: {
                    serviceID
                },
                headers: getHeaders()
            }
        );

        console.log(
            `VTPASS DATA VARIATIONS [${serviceID}]:`,
            JSON.stringify(response.data, null, 2)
        );

        return response.data;

    } catch (error) {
        console.error(
            "VTpass data variations error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// BUY AIRTIME
// ======================================================

const purchaseAirtime = async (
    serviceID,
    amount,
    phone,
    request_id
) => {
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
                headers: getPostHeaders()
            }
        );

        console.log(
            "VTPASS AIRTIME PURCHASE RESPONSE:",
            JSON.stringify(response.data, null, 2)
        );

        return response.data;

    } catch (error) {
        console.error(
            "VTpass airtime purchase error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// BUY DATA
// ======================================================

const purchaseData = async (
    serviceID,
    variation_code,
    amount,
    phone,
    request_id
) => {
    try {
        const payload = {
            request_id,
            serviceID,
            billersCode: phone,
            variation_code,
            amount,
            phone
        };

        const response = await axios.post(
            `${VTPASS_BASE_URL}/pay`,
            payload,
            {
                headers: getPostHeaders()
            }
        );

        console.log(
            "VTPASS DATA PURCHASE RESPONSE:",
            JSON.stringify(response.data, null, 2)
        );

        return response.data;

    } catch (error) {
        console.error(
            "VTpass data purchase error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// REQUERY TRANSACTION
// ======================================================

const requeryTransaction = async (request_id) => {
    try {
        const response = await axios.post(
            `${VTPASS_BASE_URL}/requery`,
            {
                request_id
            },
            {
                headers: getPostHeaders()
            }
        );

        console.log(
            "VTPASS REQUERY RESPONSE:",
            JSON.stringify(response.data, null, 2)
        );

        return response.data;

    } catch (error) {
        console.error(
            "VTpass transaction requery error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    getServiceCategories,
    getAirtimeServices,
    getDataVariations,
    purchaseAirtime,
    purchaseData,
    requeryTransaction
};