const path = require("path");
const express = require("express");

// Load environment variables FIRST - before any other requires
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: 'config/config.env' });
}

const cloudinary = require("cloudinary");
const app = require("./app");
const connectDatabase = require("./config/database");

// Uncaught Exception
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});



// Connect Database
connectDatabase();

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Deployment
__dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "frontend", "build")));

    app.get("/", (req, res) => {
        res.json({
            success: true,
            message: "Buyer Seller Backend API Running 🚀",
        });
    });
} else {
    app.get("/", (req, res) => {
        res.send("Server is Running! 🚀");
    });
}

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
});

module.exports = app;