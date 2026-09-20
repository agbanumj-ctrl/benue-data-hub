require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3001;


// ========================================
// CHECK ENVIRONMENT
// ========================================

console.log("MongoDB URL loaded:", !!process.env.MONGODB_URI);
console.log("Paystack Secret Key loaded:", !!process.env.PAYSTACK_SECRET_KEY);
console.log("Paystack Public Key loaded:", !!process.env.PAYSTACK_PUBLIC_KEY);


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


// ========================================
// REQUEST LOGGER
// ========================================

app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});


// ========================================
// FRONTEND
// ========================================

app.use(express.static(path.join(__dirname, "frontend")));


// ========================================
// AUTHENTICATION ROUTES
// ========================================

const authRoutes = require("./server/routes/authRoutes");

app.use("/api/auth", authRoutes);


// ========================================
// VTPASS ROUTES
// ========================================

const vtpassRoutes = require("./server/routes/vtpassroutes");

app.use("/api/vtpass", vtpassRoutes);


// ========================================
// TRANSACTION ROUTES
// ========================================

const transactionRoutes = require("./server/routes/transactionRoutes");

app.use("/api/transactions", transactionRoutes);
// ========================================
// WALLET ROUTES
// ========================================

const walletRoutes = require("./server/routes/walletRoutes");

app.use("/api/wallet", walletRoutes);

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
// HOME ROUTE
// ========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


// ========================================
// MONGODB CONNECTION
// ========================================

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`Benue Data Hub server running on port ${PORT}`);
});