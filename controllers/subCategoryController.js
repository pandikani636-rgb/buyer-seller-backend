const SubCategory = require("../models/subCategoryModel");
const Category = require("../models/categoryModel");
const Counter = require("../models/counterModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");

// Create SubCategory ---ADMIN
exports.createSubCategory = asyncErrorHandler(async (req, res, next) => {
    const { name, category, description } = req.body;

    if (!name || !category) {
        return next(new ErrorHandler("Name and Category are required", 400));
    }

    // Reset counter if no subcategories exist
    const total = await SubCategory.countDocuments();
    if (total === 0) {
        await Counter.findByIdAndUpdate(
            { _id: "subCategoryId" },
            { seq: 0 },
            { upsert: true }
        );
    }

    const subCategory = await SubCategory.create({
        name,
        category,
        description: description || ""
    });

    res.status(201).json({
        success: true,
        subCategory,
    });
});

// Get All SubCategories
exports.getAllSubCategories = asyncErrorHandler(async (req, res, next) => {
    const subCategories = await SubCategory.find().populate("category", "name type");
    res.status(200).json({
        success: true,
        subCategories
    });
});

// Get Single SubCategory
exports.getSubCategoryDetails = asyncErrorHandler(async (req, res, next) => {
    const subCategory = await SubCategory.findById(req.params.id).populate("category", "name type");

    if (!subCategory) {
        return next(new ErrorHandler("SubCategory not found", 404));
    }

    res.status(200).json({
        success: true,
        subCategory,
    });
});

// Update SubCategory ---ADMIN
exports.updateSubCategory = asyncErrorHandler(async (req, res, next) => {
    let subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
        return next(new ErrorHandler("SubCategory not found", 404));
    }

    subCategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        subCategory,
    });
});

// Delete SubCategory ---ADMIN
exports.deleteSubCategory = asyncErrorHandler(async (req, res, next) => {
    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
        return next(new ErrorHandler("SubCategory not found", 404));
    }

    await subCategory.remove();

    res.status(200).json({
        success: true,
        message: "SubCategory deleted successfully"
    });
});
