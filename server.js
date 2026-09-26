require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;


// ========================================
// CHECK ENVIRONMENT
// ========================================

console.log(
    "MongoDB URL loaded:",
    !!process.env.MONGODB_URI
);

console.log(
    "PAYSTACK Secret Key loaded:",
    !!process.env.PAYSTACK_SECRET_KEY
);

console.log(
    "PAYSTACK Public Key loaded:",
    !!process.env.PAYSTACK_PUBLIC_KEY
);


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

app.use(
    cors({
        origin: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// ========================================
// REQUEST LOGGER
// ========================================

app.use((req, res, next) => {
    console.log(
        "REQUEST:",
        req.method,
        req.url
    );

    next();
});


// ========================================
// FRONTEND
// ========================================

app.use(
    express.static(
        path.join(__dirname, "frontend")
    )
);


// ========================================
// AUTHENTICATION ROUTES
// ========================================

const authRoutes = require("./server/routes/authRoutes");

app.use(
    "/api/auth",
    authRoutes
);


// ========================================
// VTPASS ROUTES
// ========================================

const vtpassRoutes = require("./server/routes/vtpassRoutes");

app.use(
    "/api/vtpass",
    vtpassRoutes
);


// ========================================
// TRANSACTION ROUTES
// ========================================

const transactionRoutes = require("./server/routes/transactionRoutes");

app.use(
    "/api/transactions",
    transactionRoutes
);


// ========================================
// WALLET ROUTES
// ========================================

const walletRoutes = require("./server/routes/walletRoutes");

app.use(
    "/api/wallet",
    walletRoutes
);


// ========================================
// VENDOR ROUTES
// ========================================

const vendorRoutes = require("./server/routes/vendorRoutes");

app.use(
    "/api/vendor",
    vendorRoutes
);


// ========================================
// ADMIN ROUTES
// ========================================

const adminRoutes = require("./server/routes/adminRoutes");

app.use(
    "/api/admin",
    adminRoutes
);


// ========================================
// DIRECT POST TEST ROUTE
// ========================================

app.post("/test", (req, res) => {
    res.json({
        success: true,
        message: "Direct POST route is working!"
    });
});


// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Benue Data Hub API is running.",
        timestamp: new Date().toISOString()
    });
});


// ========================================
// HOME ROUTE
// ========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "frontend",
            "index.html"
        )
    );
});


// ========================================
// 404 API HANDLER
// ========================================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});


// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {
    console.error(
        "SERVER ERROR:",
        error
    );

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});


// ========================================
// MONGODB CONNECTION
// ========================================

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log(
            "MongoDB connected successfully!"
        );
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log(
        `Benue Data Hub server running on port ${PORT}`
    );
});