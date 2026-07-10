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

const checkProducts = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");
        const products = await Product.find({});
        console.log("Total products:", products.length);
        products.forEach(p => {
            console.log(`- ${p.name}: status=${p.status}, price=${p.price}, ratings=${p.ratings}, category=${p.category}, seller=${p.seller}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkProducts();
