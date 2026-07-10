const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const Seller = require('./models/sellerModel');
const Product = require('./models/productModel');
const Category = require('./models/categoryModel');
const SubCategory = require('./models/subCategoryModel');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flipkart');
        console.log('Connected to MongoDB...');

        // 1. Create a Sample Seller if none exists
        let seller = await Seller.findOne({ email: 'testseller@example.com' });
        if (!seller) {
            console.log('Creating sample seller...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            seller = await Seller.create({
                name: 'Test Seller',
                email: 'testseller@example.com',
                phone: '1234567890',
                password: hashedPassword,
                companyName: 'Test Pharma Inc',
                businessType: 'pharmacy',
                address: {
                    street: '123 Medical St',
                    city: 'New Delhi',
                    state: 'Delhi',
                    pincode: '110001',
                    country: 'India'
                },
                role: 'seller',
                status: 'active'
            });
        }

        // 2. Clear existing products to avoid duplicates during seeding
        await Product.deleteMany({});
        console.log('Existing products cleared.');

        // 3. Add Sample Products
        const products = [
            {
                name: 'Digital Thermometer',
                description: 'Fast and accurate digital thermometer for all ages.',
                price: 299,
                cuttedPrice: 499,
                images: [
                    {
                        public_id: 'sample/temp1',
                        url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500'
                    }
                ],
                category: 'Health Care',
                stock: 100,
                numOfReviews: 10,
                ratings: 4.5,
                seller: seller._id,
                user: seller._id // Associated with the seller's internal ID
            },
            {
                name: 'N95 Respirator Mask',
                description: 'High-quality N95 mask for maximum protection.',
                price: 150,
                cuttedPrice: 250,
                images: [
                    {
                        public_id: 'sample/mask1',
                        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500'
                    }
                ],
                category: 'Safety',
                stock: 500,
                numOfReviews: 50,
                ratings: 4.8,
                seller: seller._id,
                user: seller._id
            },
            {
                name: 'First Aid Kit Professional',
                description: 'Emergency medical kit containing 100 essential items.',
                price: 1200,
                cuttedPrice: 1999,
                images: [
                    {
                        public_id: 'sample/kit1',
                        url: 'https://images.unsplash.com/photo-1512428559083-a40ea9013be0?w=500'
                    }
                ],
                category: 'Medical Supplies',
                stock: 30,
                numOfReviews: 5,
                ratings: 4.2,
                seller: seller._id,
                user: seller._id
            }
        ];

        const insertedProducts = await Product.insertMany(products);
        console.log(`${insertedProducts.length} products seeded successfully!`);

        // Update seller with product references
        seller.products = insertedProducts.map(p => p._id);
        await seller.save();
        console.log('Seller product references updated.');

        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
