const mongoose = require("mongoose");
const Counter = require("./counterModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const sellerSchema = new mongoose.Schema({
    sellerId: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: [true, "Please enter name"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Please enter email"],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email"
        ]
    },
    phone: {
        type: String,
        required: [true, "Please enter phone number"],
        unique: true,
        match: [
            /^[0-9]{10}$/,
            "Phone number must be 10 digits"
        ]
    },
    password: {
        type: String,
        required: [true, "Please enter password"],
        minlength: [6, "Password must be at least 6 characters"]
    },
    companyName: {
        type: String,
        required: [true, "Please enter company name"],
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true
    },
    businessType: {
        type: String,
        enum: ['retailer', 'wholesaler', 'manufacturer', 'distributor', 'pharmacy', 'clinic', 'hospital'],
        default: 'retailer'
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    profileImage: {
        type: String,
        default: 'default-avatar.jpg'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        default: "seller"
    }
});

// Auto-increment sellerId
sellerSchema.pre("save", async function (next) {
    if (!this.isNew) return next();

    const counter = await Counter.findByIdAndUpdate(
        { _id: "sellerId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.sellerId = counter.seq;
    next();
});

// Update timestamp on save
sellerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// ===== HASH PASSWORD BEFORE SAVE =====
sellerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ===== JWT TOKEN =====
sellerSchema.methods.getJWTToken = function () {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRE || "7d";
    
    if (!secret) {
        console.error("ERROR: JWT_SECRET is not set in environment variables!");
        throw new Error("JWT_SECRET not configured");
    }
    
    return jwt.sign({ id: this._id }, secret, { expiresIn });
};

// ===== COMPARE PASSWORD =====
sellerSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ===== RESET PASSWORD TOKEN =====
sellerSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    return resetToken;
};

module.exports = mongoose.model("Seller", sellerSchema);