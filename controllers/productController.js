const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary');

const fs = require('fs');
const path = require('path');

// Get All Products
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {

    const resultPerPage = 12;
    const productsCount = await Product.countDocuments();
    // console.log(req.query);

    const searchFeature = new SearchFeatures(Product.find(), req.query)
        .search()
        .filter();

    let products = await searchFeature.query;
    let filteredProductsCount = products.length;

    searchFeature.pagination(resultPerPage);

    products = await searchFeature.query.clone();

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    });
});

// Get All Products ---Product Sliders
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Get Product Details
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id).populate('seller', 'companyName phone');

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// Get All Products ---ADMIN
// Get All Products ---ADMIN/SELLER
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
    let products;
    if (req.user.role === 'seller') {
        products = await Product.find({ seller: req.user.id });
    } else {
        products = await Product.find();
    }

    res.status(200).json({
        success: true,
        products,
    });
});

// Create Product ---ADMIN
// Create Product ---ADMIN/SELLER
exports.createProduct = asyncErrorHandler(async (req, res, next) => {
    console.log("Create Product Request Received", { userId: req.user?.id, role: req.user?.role });
    console.log("Files:", req.files?.length || 0);
    console.log("Body:", req.body);

    const requiredFields = ["name", "description", "price", "stock", "category"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return next(new ErrorHandler(`Missing required fields: ${missingFields.join(", ")}`, 400));
    }

    let images = [];

    if (req.files && req.files.length > 0) {
        images = req.files.map((file) => path.resolve(file.path));
    } else if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else if (Array.isArray(req.body.images) && req.body.images.length > 0) {
        images = req.body.images;
    }

    if (images.length === 0) {
        return next(new ErrorHandler("Please upload at least one product image", 400));
    }

    console.log("Images to upload:", images.length);

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        try {
            console.log(`Uploading image ${i + 1}/${images.length} to Cloudinary: ${images[i]}`);
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        } catch (uploadErr) {
            console.error(`Cloudinary upload failed for image ${i + 1}/${images.length}:`, uploadErr);
            return next(new ErrorHandler(`Failed to upload image ${i + 1}: ${uploadErr.message}`, 500));
        } finally {
            // Clean up local temp files if they came from multer
            if (req.files && req.files.length > 0 && fs.existsSync(images[i])) {
                try {
                    fs.unlinkSync(images[i]);
                } catch (unlinkErr) {
                    console.warn(`Failed to delete temp image: ${images[i]}`, unlinkErr);
                }
            }
        }
    }

    req.body.images = imagesLinks;
    req.body.user = req.user.id;

    if (req.user.role === 'seller') {
        req.body.seller = req.user.id;
    }

    console.log("Creating product in DB...");
    const product = await Product.create(req.body);

    if (req.user.role === 'seller') {
        const Seller = require('../models/sellerModel');
        await Seller.findByIdAndUpdate(req.user.id, {
            $push: { products: product._id }
        });
    }

    res.status(201).json({
        success: true,
        product,
    });
});






// Update Product ---ADMIN
// Update Product ---ADMIN/SELLER
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    // Verify ownership
    if (req.user.role === 'seller' && product.seller && product.seller.toString() !== req.user.id) {
        return next(new ErrorHandler("Not authorized to update this product", 403));
    }

    let images = [];

    // HANDLE IMAGES
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.path);
    } else if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else if (req.body.images) {
        images = req.body.images; 
    }

    if (images !== undefined && images.length > 0) {
        // Deleting Images From Cloudinary
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });

            // Clean up local temp files if they came from multer
            if (req.files && req.files.length > 0 && fs.existsSync(images[i])) {
                fs.unlinkSync(images[i]);
            }
        }

        req.body.images = imagesLinks;
    } else {
        delete req.body.images;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({ success: true, product });
});

// Delete Product ---ADMIN
// Delete Product ---ADMIN/SELLER
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Verify ownership
    if (req.user.role === 'seller' && product.seller && product.seller.toString() !== req.user.id) {
        return next(new ErrorHandler("Not authorized to delete this product", 403));
    }

    // Deleting Images From Cloudinary
    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    await product.remove();

    res.status(200).json({
        success: true
    });
});


// Create OR Update Reviews
exports.createProductReview = asyncErrorHandler(async (req, res, next) => {

    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const isReviewed = product.reviews.find(review => review.user.toString() === req.user._id.toString());

    if (isReviewed) {

        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString())
                (rev.rating = rating, rev.comment = comment);
        });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});

// Get All Reviews of Product
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    });
});

// Delete Reveiws
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());

    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating;
    });

    let ratings = 0;

    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings: Number(ratings),
        numOfReviews,
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});