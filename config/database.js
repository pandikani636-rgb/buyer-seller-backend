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
        const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pandikani636_db_user:877887%24Pk@cluster0.chwzj4f.mongodb.net/ecommerceDb?retryWrites=true&w=majority&appName=Cluster0";
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
        
        if (e.message && e.message.includes("bad auth")) {
            throw new Error("CRITICAL ERROR: Your MongoDB Atlas Password for user 'pandikani636_db_user' is WRONG. You MUST go to MongoDB Atlas -> Database Access, and reset the password to a simple password without special characters.");
        }
        
        throw e;
    }

    return cached.conn;
}

module.exports = connectDatabase;