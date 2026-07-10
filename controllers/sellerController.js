const Seller = require("../models/sellerModel");
const sendToken = require("../utils/sendToken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendEmail");

// @desc    Register a new seller
// @route   POST /api/sellers/register
// @access  Public
const registerSeller = async (req, res) => {
    try {
        const {
            name, email, phone, password, companyName, gstNumber, businessType,
            businessAddress, businessCity, businessState, businessPincode, businessCountry
        } = req.body;

        // Check if seller already exists
        const existingSeller = await Seller.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingSeller) {
            return res.status(400).json({
                success: false,
                message: "Seller already exists with this email or phone"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create seller
        const seller = await Seller.create({
            name,
            email,
            phone,
            password: hashedPassword,
            companyName,
            gstNumber,
            businessType,
            address: {
                street: businessAddress,
                city: businessCity,
                state: businessState,
                pincode: businessPincode,
                country: businessCountry || 'India'
            }
        });

        sendToken(seller, 201, res);

    } catch (error) {
        console.error("Seller Registration Error:", error); // Log error for debugging
        res.status(500).json({
            success: false,
            message: "Error registering seller",
            error: error.message
        });
    }
};


// @desc    Login seller
// @route   POST /api/sellers/login
// @access  Public
const loginSeller = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if seller exists
        const seller = await Seller.findOne({ email });

        if (!seller) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if seller is active
        if (seller.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: "Your account is not active. Please contact support."
            });
        }

        // Verify password
        const isPasswordValid = await seller.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Update last login
        seller.lastLogin = Date.now();
        await seller.save({ validateBeforeSave: false });

        sendToken(seller, 200, res);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error logging in",
            error: error.message
        });
    }
};

// @desc    Get all sellers
// @route   GET /api/sellers
// @access  Private/Admin
const getAllSellers = async (req, res) => {
    try {
        const sellers = await Seller.find()
            .select('-password')
            .populate('products', 'name price')
            .populate('orders', 'orderId totalAmount')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: sellers.length,
            data: sellers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching sellers",
            error: error.message
        });
    }
};

// @desc    Get single seller
// @route   GET /api/sellers/:id
// @access  Private
const getSellerById = async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id)
            .select('-password')
            .populate('products')
            .populate('orders');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        res.status(200).json({
            success: true,
            data: seller
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching seller",
            error: error.message
        });
    }
};

// @desc    Update seller profile
// @route   PUT /api/sellers/:id
// @access  Private
const updateSeller = async (req, res) => {
    try {
        const { name, phone, companyName, gstNumber, businessType, address } = req.body;

        const seller = await Seller.findById(req.params.id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        // Check authorization (seller can only update their own profile)
        if (seller._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this profile"
            });
        }

        // Update fields
        seller.name = name || seller.name;
        seller.phone = phone || seller.phone;
        seller.companyName = companyName || seller.companyName;
        seller.gstNumber = gstNumber || seller.gstNumber;
        seller.businessType = businessType || seller.businessType;
        seller.address = address || seller.address;

        const updatedSeller = await seller.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                _id: updatedSeller._id,
                name: updatedSeller.name,
                email: updatedSeller.email,
                phone: updatedSeller.phone,
                companyName: updatedSeller.companyName
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating seller",
            error: error.message
        });
    }
};

// @desc    Delete seller
// @route   DELETE /api/sellers/:id
// @access  Private/Admin
const deleteSeller = async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        await seller.deleteOne();

        res.status(200).json({
            success: true,
            message: "Seller deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting seller",
            error: error.message
        });
    }
};

// @desc    Update seller status
// @route   PATCH /api/sellers/:id/status
// @access  Private/Admin
const updateSellerStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const seller = await Seller.findById(req.params.id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        seller.status = status;
        await seller.save();

        res.status(200).json({
            success: true,
            message: `Seller status updated to ${status}`,
            data: {
                _id: seller._id,
                name: seller.name,
                status: seller.status
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating seller status",
            error: error.message
        });
    }
};

// @desc    Get seller dashboard stats
// @route   GET /api/sellers/:id/stats
// @access  Private
const getSellerStats = async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id)
            .populate('products')
            .populate({
                path: 'orders',
                populate: { path: 'orderItems.product' }
            });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        const totalProducts = seller.products.length;
        const totalOrders = seller.orders.length;

        // Calculate total revenue from orders (Fix: use totalPrice instead of totalAmount)
        const totalRevenue = seller.orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        // Get recent orders (last 5)
        const recentOrders = seller.orders.slice(-5).reverse();

        // 1. Monthly Revenue (Last 6 Months)
        const monthlyRevenue = new Array(6).fill(0);
        const monthNames = [];
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            monthNames.push(d.toLocaleString('default', { month: 'short' }));
        }

        seller.orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            for (let i = 5; i >= 0; i--) {
                const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                if (orderDate.getMonth() === targetDate.getMonth() && orderDate.getFullYear() === targetDate.getFullYear()) {
                    monthlyRevenue[5 - i] += (order.totalPrice || 0);
                }
            }
        });

        // 2. Order Status Distribution
        const statusDistribution = {
            Processing: 0,
            Shipped: 0,
            Delivered: 0,
            Cancelled: 0
        };
        seller.orders.forEach(order => {
            if (statusDistribution[order.orderStatus] !== undefined) {
                statusDistribution[order.orderStatus]++;
            }
        });

        // 3. Daily Orders (Last 7 Days)
        const dailyOrders = new Array(7).fill(0);
        const dayNames = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            dayNames.push(d.toLocaleDateString('default', { weekday: 'short' }));
        }

        seller.orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const diffTime = Math.abs(today - orderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                dailyOrders[7 - diffDays]++;
            }
        });

        // 4. Top 5 Selling Products
        const productSales = {};
        seller.orders.forEach(order => {
            order.orderItems.forEach(item => {
                const productName = item.name;
                productSales[productName] = (productSales[productName] || 0) + (item.price * item.quantity);
            });
        });

        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, revenue]) => ({ name, revenue }));

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                totalOrders,
                totalRevenue,
                recentOrders,
                charts: {
                    revenueTrend: {
                        labels: monthNames,
                        data: monthlyRevenue
                    },
                    orderStatus: {
                        labels: Object.keys(statusDistribution),
                        data: Object.values(statusDistribution)
                    },
                    dailyOrders: {
                        labels: dayNames,
                        data: dailyOrders
                    },
                    topProducts: {
                        labels: topProducts.map(p => p.name),
                        data: topProducts.map(p => p.revenue)
                    }
                },
                accountCreated: seller.createdAt,
                lastLogin: seller.lastLogin,
                status: seller.status
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching seller stats",
            error: error.message
        });
    }
};

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Get current seller details
// @route   GET /api/sellers/me
// @access  Private
const getSellerDetails = async (req, res) => {
    try {
        const seller = await Seller.findById(req.user.id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller profile not found for this account"
            });
        }

        res.status(200).json({
            success: true,
            seller
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching seller details",
            error: error.message
        });
    }
};

// @desc    Forgot Password
// @route   POST /api/v1/seller/password/forgot
// @access  Public
const forgotPassword = asyncErrorHandler(async (req, res, next) => {
    const seller = await Seller.findOne({ email: req.body.email });

    if (!seller) return next(new ErrorHandler("Seller Not Found", 404));

    const resetToken = seller.getResetPasswordToken();
    await seller.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}?role=seller`;

    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">Seller Password Reset</h2>
            <p>Hello,</p>
            <p>You are receiving this email because we received a password reset request for your seller account. Please click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetPasswordUrl}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>If you did not request this, please ignore this email.</p>
            <p>This link will expire in 15 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777; text-align: center;">Quick Buy App - Seller Access Recovery Protocol</p>
        </div>
    `;

    try {
        await sendEmail({
            email: seller.email,
            subject: "Seller Password Recovery - Quick Buy",
            html: message,
        });

        res.status(200).json({
            success: true,
            message: `Reset link sent to ${seller.email} successfully`,
        });
    } catch (error) {
        seller.resetPasswordToken = undefined;
        seller.resetPasswordExpire = undefined;
        await seller.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500));
    }
});

// @desc    Reset Password
// @route   PUT /api/v1/seller/password/reset/:token
// @access  Public
const resetPassword = asyncErrorHandler(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const seller = await Seller.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!seller) return next(new ErrorHandler("Invalid or expired reset password token", 404));

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
    }

    seller.password = req.body.password; // Model hashes it during save
    seller.resetPasswordToken = undefined;
    seller.resetPasswordExpire = undefined;

    await seller.save();
    sendToken(seller, 200, res);
});

module.exports = {
    registerSeller,
    loginSeller,
    getAllSellers,
    getSellerById,
    updateSeller,
    deleteSeller,
    updateSellerStatus,
    getSellerStats,
    getSellerDetails,
    forgotPassword,
    resetPassword
};