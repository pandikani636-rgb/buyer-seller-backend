const mongoose = require('mongoose');

const connectDatabase = () => {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerceDb";
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log("Mongoose Connected");
        })
        .catch((err) => {
            console.error("MongoDB connection error:", err.message);
            // Removed process.exit(1) so Vercel doesn't crash completely and strip CORS headers
        });
}

module.exports = connectDatabase;