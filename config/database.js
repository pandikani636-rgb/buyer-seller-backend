const mongoose = require('mongoose');

let isConnected = false;

const connectDatabase = async () => {
    mongoose.set('strictQuery', false);

    if (isConnected) {
        console.log("=> using existing database connection");
        return;
    }

    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerceDb";
        console.log("=> connecting to database...");
        const db = await mongoose.connect(MONGO_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        isConnected = db.connections[0].readyState === 1;
        console.log("Mongoose Connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
}

module.exports = connectDatabase;