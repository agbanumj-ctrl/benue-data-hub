const Transaction = require("../models/transaction");

const createTransaction = async (req, res) => {
    try {
        const { service, serviceID, phone, amount, requestId } = req.body;

        if (!service || !serviceID || !phone || !amount || !requestId) {
            return res.status(400).json({
                success: false,
                message: "All transaction fields are required."
            });
        }

        const transaction = await Transaction.create({
            user: req.user.id,
            service,
            serviceID,
            phone,
            amount,
            requestId
        });

        res.status(201).json({
            success: true,
            message: "Transaction created successfully.",
            data: transaction
        });
    } catch (error) {
        console.error("Transaction creation error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to create transaction."
        });
    }
};

const updateTransaction = async (requestId, transactionId, status) => {
    const transaction = await Transaction.findOneAndUpdate(
        { requestId },
        {
            transactionId,
            status
        },
        { new: true }
    );

    return transaction;
};

module.exports = {
    createTransaction,
    updateTransaction
};