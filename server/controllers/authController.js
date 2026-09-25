const Vendor = require("../models/vendor");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");


// ========================================
// REGISTER A NEW USER / VENDOR
// ========================================

const registerUser = async (req, res) => {
    try {

        const {
            name,
            email,
            phone,
            password,
            role
        } = req.body;


        // ----------------------------------------
        // VALIDATION
        // ----------------------------------------

        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, phone and password are required."
            });
        }


        // ----------------------------------------
        // CLEAN INPUTS
        // ----------------------------------------

        const cleanName = String(name).trim();

        const cleanEmail =
            String(email).toLowerCase().trim();

        const cleanPhone =
            String(phone).trim();

        const requestedRole =
            String(role || "user")
                .toLowerCase()
                .trim();


        // ----------------------------------------
        // BASIC VALIDATION
        // ----------------------------------------

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Name must contain at least 2 characters."
            });
        }

        if (!cleanEmail.includes("@")) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });
        }

        if (cleanPhone.length < 7) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid phone number."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters."
            });
        }


        // ----------------------------------------
        // ONLY USER OR VENDOR CAN REGISTER
        // ADMIN CANNOT REGISTER PUBLICLY
        // ----------------------------------------

        if (
            requestedRole !== "user" &&
            requestedRole !== "vendor"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid account type."
            });
        }


        // ----------------------------------------
        // CHECK DUPLICATE EMAIL / PHONE
        // ----------------------------------------

        const existingUser =
            await User.findOne({
                $or: [
                    {
                        email: cleanEmail
                    },
                    {
                        phone: cleanPhone
                    }
                ]
            });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message:
                    "User with this email or phone already exists."
            });
        }


        // ----------------------------------------
        // HASH PASSWORD
        // ----------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // ----------------------------------------
        // CREATE USER ACCOUNT
        // ----------------------------------------

        const user =
            await User.create({

                name:
                    cleanName,

                email:
                    cleanEmail,

                phone:
                    cleanPhone,

                password:
                    hashedPassword,

                role:
                    requestedRole,

                walletBalance:
                    0,

                isVerified:
                    false,

                isActive:
                    true
            });


        // ----------------------------------------
        // CREATE VENDOR PROFILE
        // ----------------------------------------
        // Vendors have a User account AND
        // a separate Vendor business profile.

        if (requestedRole === "vendor") {

            await Vendor.create({

                user:
                    user._id,

                businessPhone:
                    cleanPhone,

                businessName:
                    cleanName,

                isApproved:
                    false,

                isActive:
                    true
            });
        }


        // ----------------------------------------
        // RESPONSE
        // ----------------------------------------

        return res.status(201).json({

            success: true,

            message:
                requestedRole === "vendor"
                    ? "Vendor account created successfully."
                    : "Customer account created successfully.",

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                phone:
                    user.phone,

                role:
                    user.role,

                walletBalance:
                    user.walletBalance,

                isVerified:
                    user.isVerified,

                isActive:
                    user.isActive
            }
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error.message
        );

        // ----------------------------------------
        // HANDLE MONGOOSE DUPLICATE ERROR
        // ----------------------------------------

        if (error.code === 11000) {

            return res.status(400).json({
                success: false,
                message:
                    "An account with these details already exists."
            });
        }

        return res.status(500).json({

            success: false,

            message:
                "Server error during registration."
        });
    }
};


// ========================================
// LOGIN
// USER / VENDOR / ADMIN
// ========================================

const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // ----------------------------------------
        // VALIDATION
        // ----------------------------------------

        if (
            !email ||
            !password
        ) {
            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."
            });
        }


        // ----------------------------------------
        // FIND ACCOUNT
        // ----------------------------------------

        const user =
            await User.findOne({
                email:
                    String(email)
                        .toLowerCase()
                        .trim()
            });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."
            });
        }


        // ----------------------------------------
        // CHECK ACCOUNT STATUS
        // ----------------------------------------

        if (user.isActive === false) {

            return res.status(403).json({

                success: false,

                message:
                    "This account has been disabled. Please contact support."
            });
        }


        // ----------------------------------------
        // CHECK PASSWORD
        // ----------------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."
            });
        }


        // ----------------------------------------
        // CREATE JWT
        // ----------------------------------------

        const token =
            jwt.sign(

                {
                    id:
                        user._id.toString(),

                    role:
                        user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d"
                }
            );


        // ----------------------------------------
        // LOGIN RESPONSE
        // ----------------------------------------

        return res.json({

            success: true,

            message:
                "Login successful.",

            token,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                phone:
                    user.phone,

                role:
                    user.role,

                walletBalance:
                    user.walletBalance,

                isVerified:
                    user.isVerified,

                isActive:
                    user.isActive
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Server error during login."
        });
    }
};


// ========================================
// EXPORT
// ========================================

module.exports = {
    registerUser,
    loginUser
};
