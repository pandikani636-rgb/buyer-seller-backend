const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDatabase = async () => {
    mongoose.set('strictQuery', false);

    if (cached.conn) {
        console.log("=> using existing database connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerceDb";
        console.log("=> connecting to database...");
        
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            console.log("Mongoose Connected");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("MongoDB connection error:", e.message);
        throw e;
    }

    return cached.conn;
}

module.exports = connectDatabase;