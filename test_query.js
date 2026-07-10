const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/productModel');
const SearchFeatures = require('./utils/searchFeatures');

dotenv.config({ path: 'config/config.env' });

const testQuery = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ecommerceDb');
        console.log('Connected to MongoDB');

        // Simulate req.query from frontend (per the screenshot defaults)
        const reqQuery = {
            keyword: '',
            page: '1',
            price: { gte: '0', lte: '200000' },
            ratings: { gte: '0' }
        };

        const searchFeature = new SearchFeatures(Product.find(), reqQuery)
            .search()
            .filter();

        console.log('Final Mongoose Filter:', JSON.stringify(searchFeature.query.getFilter(), null, 2));

        const products = await searchFeature.query;
        console.log(`Results Found: ${products.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testQuery();
