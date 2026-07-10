const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('./asyncErrorHandler');

exports.isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {

    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Please Login to Access", 401))
    }

    if (!process.env.JWT_SECRET) {
        return next(new ErrorHandler("Server configuration error: JWT_SECRET not set", 500));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);

    // If no user found, try finding seller
    if (!req.user) {
        const Seller = require('../models/sellerModel');
        req.user = await Seller.findById(decodedData.id);
    }

    if (!req.user) {
        return next(new ErrorHandler("User/Seller not found", 401));
    }

    next();
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed`, 403));
        }
        next();
    }
}