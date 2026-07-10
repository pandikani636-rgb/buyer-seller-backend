const mongoose = require('mongoose');
const MONGO_URI = "mongodb://127.0.0.1:27017/ecommerceDb";

const productSchema = new mongoose.Schema({
    name: String,
    status: String,
    price: Number,
    ratings: Number,
    category: String,
    seller: mongoose.Schema.ObjectId
});

const Product = mongoose.model('Product', productSchema);

const testQuery = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");
        
        console.log("\n--- Query with ratings: { $gte: 0 } ---");
        const productsWithRatingFilter = await Product.find({ ratings: { $gte: 0 } });
        console.log("Count:", productsWithRatingFilter.length);
        productsWithRatingFilter.forEach(p => console.log(`- ${p.name}`));

        console.log("\n--- Query without ratings filter ---");
        const allProducts = await Product.find({});
        console.log("Total Count:", allProducts.length);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

testQuery();
