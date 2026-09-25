const jwt = require("jsonwebtoken");


// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

const authMiddleware = (req, res, next) => {
    try {

        const authHeader =
            req.headers.authorization;


        // ----------------------------------------
        // CHECK AUTHORIZATION HEADER
        // ----------------------------------------

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }


        // ----------------------------------------
        // CHECK BEARER FORMAT
        // ----------------------------------------

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            });
        }


        // ----------------------------------------
        // GET TOKEN
        // ----------------------------------------

        const token =
            authHeader.split(" ")[1];


        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing."
            });
        }


        // ----------------------------------------
        // VERIFY TOKEN
        // ----------------------------------------

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ----------------------------------------
        // SAVE USER INFORMATION
        // ----------------------------------------

        req.user = {
            id: decoded.id,
            role: decoded.role
        };


        next();

    } catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );


        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Your session has expired. Please login again."
            });
        }


        return res.status(401).json({
            success: false,
            message: "Invalid authentication token."
        });
    }
};


module.exports = authMiddleware;