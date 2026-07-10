const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
    },
    gender: {
        type: String,
        required: [true, "Please Enter Gender"],
    },
    phone: {
        type: String,
        required: [true, "Please Enter Your Phone Number"],
    },
    address: {
        type: String,
        required: [true, "Please Enter Your Address"],
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minlength: [8, "Password should have at least 8 characters"],
        select: false,
    },
    role: {
        type: String,
        default: "user",
        enum: ["user", "doctor", "admin"],
    },

    // Doctor extra fields
    clinicname: {
        type: String,
        required: function () { return this.role === "doctor"; }
    },
    clinicid: {
        type: String,
        required: function () { return this.role === "doctor"; }
    },
    qualification: {
        type: String,
        required: function () { return this.role === "doctor"; }
    },
    specialization: {
        type: String,
        required: function () { return this.role === "doctor"; }
    },
    registrationNumber: {
        type: String,
        required: function () { return this.role === "doctor"; }
    },
    medicalCouncilName: {
        type: String,
        required: function () { return this.role === "doctor"; }
    },
    yearsOfExperience: {
        type: Number,
        required: function () { return this.role === "doctor"; }
    },
    registrationCertificate: {
        public_id: {
            type: String,
            required: function () { return this.role === "doctor"; }
        },
        url: {
            type: String,
            required: function () { return this.role === "doctor"; }
        },
    },
    doctorIdProof: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    profilePhoto: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },

    wishlist: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
        },
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

// ===== HASH PASSWORD BEFORE SAVE =====
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ===== JWT TOKEN =====
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET || "FLIPKART", {
        expiresIn: "3d",
    });
};

// ===== COMPARE PASSWORD =====
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ===== RESET PASSWORD TOKEN =====
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    return resetToken;
};

module.exports = mongoose.model("User", userSchema);
