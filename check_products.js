const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./models/productModel');

dotenv.config({ path: 'config/config.env' });

const checkProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flipkart');
        console.log('Connected to MongoDB');

        const count = await Product.countDocuments();
        console.log(`Total Products in DB: ${count}`);

        const products = await Product.find().limit(5);
        console.log('Sample Products:');
        console.log(JSON.stringify(products, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkProducts();
