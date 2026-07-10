const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true
    },

    description: {
        type: String,
        required: [true, "Please enter product description"]
    },

    price: {
        type: Number,
        required: [true, "Please enter product price"]
    },

    // ❌ cuttedPrice removed

    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],

    category: {
        type: String,
        required: [true, "Please enter product category"]
    },

    stock: {
        type: Number,
        required: [true, "Please enter product stock"],
        max: [9999, "Stock cannot exceed 9999"],
        default: 1
    },

    ratings: {
        type: Number,
        default: 0
    },

    numOfReviews: {
        type: Number,
        default: 0
    },

    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],

    // ✅ NEW FIELD ADDED
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },

    subCategoryType: {
        type: String,
        enum: ["Prescription", "Non-Prescription"],
        default: "Non-Prescription"
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: "Seller",
        required: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
