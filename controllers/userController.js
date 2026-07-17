const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const cloudinary = require('cloudinary');

// ===== REGISTER USER =====
exports.registerUser = asyncErrorHandler(async (req, res, next) => {
    const {
        name,
        email,
        phone,
        address,
        gender,
        role,
        password,
        clinicname,
        // clinicid, // Might be missing, so we generate if needed
        qualification,
        specialization,
        registrationNumber,
        medicalCouncilName,
        yearsOfExperience
    } = req.body;

    // Required fields check
    if (!name || !email || !phone || !address || !gender || !password || !role) {
        return next(new ErrorHandler("Please fill all required fields", 400));
    }

    let finalRole = role.toLowerCase();
    if (finalRole.includes("doctor")) {
        finalRole = "doctor";
    }

    const userData = { name, email, phone, address, gender, password, role: finalRole };

    if (finalRole === "doctor") {
        userData.clinicname = clinicname;
        // Generate clinicid if not provided
        userData.clinicid = req.body.clinicid || `CLINIC_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        userData.qualification = qualification;
        userData.specialization = specialization;
        userData.registrationNumber = registrationNumber;
        userData.medicalCouncilName = medicalCouncilName;
        userData.yearsOfExperience = yearsOfExperience;

        // Document Uploads
        if (req.body.registrationCertificate) {
            const myCloud = await cloudinary.v2.uploader.upload(req.body.registrationCertificate, {
                folder: "doctors/certificates",
            });
            userData.registrationCertificate = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        } else {
            return next(new ErrorHandler("Registration Certificate is required for doctors", 400));
        }

        if (req.body.doctorIdProof) {
            const myCloud = await cloudinary.v2.uploader.upload(req.body.doctorIdProof, {
                folder: "doctors/id_proofs",
            });
            userData.doctorIdProof = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        if (req.body.profilePhoto) {
            const myCloud = await cloudinary.v2.uploader.upload(req.body.profilePhoto, {
                folder: "doctors/profiles",
            });
            userData.profilePhoto = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
    }

    const user = await User.create(userData);
    sendToken(user, 201, res);
});

// ===== LOGIN USER =====
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email And Password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    sendToken(user, 200, res);
});

// ===== LOGOUT USER =====
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});

// ===== GET USER DETAILS =====
exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// ===== FORGOT PASSWORD =====
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return next(new ErrorHandler("User Not Found", 404));

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Use FRONTEND_URL from environment or default to localhost:3000
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}?role=user`;

    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>You are receiving this email because we received a password reset request for your account. Please click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetPasswordUrl}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>If you did not request this, please ignore this email.</p>
            <p>This link will expire in 15 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777; text-align: center;">Quick Buy App - Access Recovery Protocol</p>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Recovery - Quick Buy",
            html: message,
        });

        res.status(200).json({
            success: true,
            message: `Reset link sent to ${user.email} successfully`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500));
    }
});

// ===== RESET PASSWORD =====
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return next(new ErrorHandler("Invalid reset password token", 404));

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user, 200, res);
});

// ===== UPDATE PASSWORD =====
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) return next(new ErrorHandler("Old Password is Invalid", 400));

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
});

// ===== UPDATE PROFILE =====
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        address: req.body.address,
        // Doctor specific fields update
        clinicname: req.body.clinicname,
        clinicid: req.body.clinicid,
        qualification: req.body.qualification,
        specialization: req.body.specialization,
        registrationNumber: req.body.registrationNumber,
        medicalCouncilName: req.body.medicalCouncilName,
        yearsOfExperience: req.body.yearsOfExperience,
    };

    // Handle Profile Photo (previously avatar)
    // NOTE: Schema uses profilePhoto, not avatar.
    if (req.body.profilePhoto) {
        const user = await User.findById(req.user.id);
        if (user.profilePhoto?.public_id) {
            await cloudinary.v2.uploader.destroy(user.profilePhoto.public_id);
        }
        const myCloud = await cloudinary.v2.uploader.upload(req.body.profilePhoto, {
            folder: "doctors/profiles", // Keeping consistent with registration
            width: 150,
            crop: "scale",
        });
        newUserData.profilePhoto = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    } else if (req.body.avatar) {
        // Fallback if frontend still sends 'avatar' key but means profilePhoto
        const user = await User.findById(req.user.id);
        if (user.profilePhoto?.public_id) {
            await cloudinary.v2.uploader.destroy(user.profilePhoto.public_id);
        }
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "doctors/profiles",
            width: 150,
            crop: "scale",
        });
        newUserData.profilePhoto = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    }

    // Handle Doctor Documents
    const handleDocUpload = async (docName, folder) => {
        if (req.body[docName]) {
            const user = await User.findById(req.user.id);
            if (user[docName]?.public_id) {
                await cloudinary.v2.uploader.destroy(user[docName].public_id);
            }
            const myCloud = await cloudinary.v2.uploader.upload(req.body[docName], {
                folder: `doctors/${folder}`,
            });
            newUserData[docName] = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
    };

    await handleDocUpload('registrationCertificate', 'certificates');
    await handleDocUpload('doctorIdProof', 'id_proofs');
    // profilePhoto is handled above

    await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({ success: true });
});

// ===== WISHLIST =====
// Add To Wishlist
exports.addToWishlist = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    const product = req.body.productId;

    if (user.wishlist.includes(product)) {
        return next(new ErrorHandler("Product Already in Wishlist", 400));
    }

    user.wishlist.push(product);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "Added to Wishlist",
    });
});

// Remove From Wishlist
exports.removeFromWishlist = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    const product = req.params.id;

    if (!user.wishlist.includes(product)) {
        return next(new ErrorHandler("Product Not Found in Wishlist", 404));
    }

    user.wishlist = user.wishlist.filter((pid) => pid.toString() !== product);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "Removed from Wishlist",
    });
});

// Get Wishlist
exports.getWishlist = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate("wishlist");

    res.status(200).json({
        success: true,
        wishlist: user.wishlist,
    });
});

// ===== ADMIN ROUTES =====
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({ success: true, users });
});

exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
    res.status(200).json({ success: true, user });
});

exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        role: req.body.role,
    };

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({ success: true });
});

exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));

    await user.remove();
    res.status(200).json({ success: true });
});
