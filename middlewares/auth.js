const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('./asyncErrorHandler');

exports.isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {

    const { token } = req.cookies;

    if (!token) {
        console.warn("No token found in cookies. Available cookies:", Object.keys(req.cookies || {}));
        return next(new ErrorHandler("Please Login to Access this resource", 401))
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET environment variable is not set");
        return next(new ErrorHandler("Server configuration error: JWT_SECRET not set", 500));
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decodedData.id);

        // If no user found, try finding seller
        if (!req.user) {
            const Seller = require('../models/sellerModel');
            req.user = await Seller.findById(decodedData.id);
        }

        if (!req.user) {
            return next(new ErrorHandler("User/Seller not found in database", 401));
        }

        next();
    } catch (jwtErr) {
        console.error("JWT verification failed:", jwtErr.message);
        return next(new ErrorHandler(`Authentication failed: ${jwtErr.message}`, 401));
    }
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed`, 403));
        }
        next();
    }
}