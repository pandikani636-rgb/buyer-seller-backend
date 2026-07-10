const mongoose = require("mongoose");
const Counter = require("./counterModel");

const categorySchema = new mongoose.Schema({
    categoryId: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: [true, "Please enter category name"],
        trim: true
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

// Auto-increment categoryId
categorySchema.pre("save", async function (next) {
    if (!this.isNew) return next();

    const counter = await Counter.findByIdAndUpdate(
        { _id: "categoryId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.categoryId = counter.seq;
    next();
});

module.exports = mongoose.model("Category", categorySchema);
