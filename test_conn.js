const mongoose = require('mongoose');
const uris = [
    'mongodb://127.0.0.1:27017/ecommerceDb',
    'mongodb://localhost:27017/ecommerceDb',
    'mongodb://127.0.0.1:27017/flipkart',
    'mongodb://localhost:27017/flipkart'
];

const test = async () => {
    for (const uri of uris) {
        try {
            console.log(`Trying ${uri}...`);
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
            console.log(`SUCCESS: Connected to ${uri}`);
            await mongoose.disconnect();
        } catch (err) {
            console.log(`FAILED: ${uri} - ${err.message}`);
        }
    }
    process.exit(0);
};

test();
