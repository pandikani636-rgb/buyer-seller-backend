const mongoose = require("mongoose");
const Counter = require("./counterModel");

const subCategorySchema = new mongoose.Schema({
    subCategoryId: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: [true, "Please enter sub-category name"],
        trim: true
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
        required: [true, "Please select parent category"]
    },
    description: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-increment subCategoryId
subCategorySchema.pre("save", async function (next) {
    if (!this.isNew) return next();

    const counter = await Counter.findByIdAndUpdate(
        { _id: "subCategoryId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.subCategoryId = counter.seq;
    next();
});

module.exports = mongoose.model("SubCategory", subCategorySchema);
