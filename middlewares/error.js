const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
    console.error("Backend Error:", err);
    // default values
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // MongoDB CastError
    if (err.name === "CastError") {
        message = `Resource Not Found. Invalid: ${err.path}`;
        statusCode = 400;
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        statusCode = 400;
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        message = "Invalid JWT Token";
        statusCode = 400;
    }

    // JWT expired error
    if (err.name === "TokenExpiredError") {
        message = "JWT Token has expired";
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};
