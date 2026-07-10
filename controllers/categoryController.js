const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Counter = require("../models/counterModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");

// Create Category ---ADMIN
exports.createCategory = asyncErrorHandler(async (req, res, next) => {
    console.log("📝 Received category data:", req.body);

    const { name, description } = req.body;

    if (!name) {
        return next(new ErrorHandler("Name is required", 400));
    }

    // 🔥 If no categories exist, reset counter to start from 1 again
    const totalCategories = await Category.countDocuments();
    if (totalCategories === 0) {
        await Counter.findByIdAndUpdate(
            { _id: "categoryId" },
            { seq: 0 },
            { upsert: true }
        );
    }

    const category = await Category.create({
        name,
        description: description || ""
    });

    console.log("✅ Category created successfully:", category);

    res.status(201).json({
        success: true,
        category,
    });
});

// Get All Categories
exports.getAllCategories = asyncErrorHandler(async (req, res, next) => {
    const categories = await Category.find();
    
    // Append product count to each category
    const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
            const productCount = await Product.countDocuments({ category: category.name });
            return {
                ...category.toObject(),
                productCount
            };
        })
    );

    res.status(200).json({
        success: true,
        categories: categoriesWithCount
    });
});

// Get Single Category
exports.getCategoryDetails = asyncErrorHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    res.status(200).json({
        success: true,
        category,
    });
});

// Update Category ---ADMIN
exports.updateCategory = asyncErrorHandler(async (req, res, next) => {
    let category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        category,
    });
});

// Delete Category ---ADMIN
exports.deleteCategory = asyncErrorHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    await category.remove();

    res.status(200).json({
        success: true,
        message: "Category deleted successfully"
    });
});
