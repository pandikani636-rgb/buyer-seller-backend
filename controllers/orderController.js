const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendWhatsapp = require('../utils/sendWhatsapp');

// Create New Order
exports.newOrder = asyncErrorHandler(async (req, res, next) => {

    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    // Validate required fields
    if (!shippingInfo || !orderItems || !paymentInfo) {
        return next(new ErrorHandler('Missing required order information', 400));
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return next(new ErrorHandler('Order must contain at least one item', 400));
    }

    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
        return next(new ErrorHandler('Invalid order total', 400));
    }

    // Group items by seller
    const sellerItems = {};

    for (const item of orderItems) {
        // Validate product exists
        const product = await Product.findById(item.product);
        if (!product) {
            return next(new ErrorHandler(`Product ${item.product} not found`, 404));
        }

        const sellerId = product.seller ? product.seller.toString() : 'admin';

        if (!sellerItems[sellerId]) {
            sellerItems[sellerId] = [];
        }
        sellerItems[sellerId].push(item);
    }

    // Create order for each seller
    const createdOrders = [];
    const totalItemsPrice = itemsPrice || orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    for (const [sellerId, items] of Object.entries(sellerItems)) {
        const orderTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Calculate proportionate tax and shipping
        const ratio = orderTotal / totalItemsPrice;
        const proportionateTax = parseFloat((taxPrice * ratio).toFixed(2));
        const proportionateShipping = parseFloat((shippingPrice * ratio).toFixed(2));
        const proportionateTotal = parseFloat((orderTotal + proportionateTax + proportionateShipping).toFixed(2));

        const orderData = {
            shippingInfo,
            orderItems: items,
            paymentInfo,
            itemsPrice: orderTotal,
            taxPrice: proportionateTax,
            shippingPrice: proportionateShipping,
            totalPrice: proportionateTotal,
            paidAt: Date.now(),
            user: req.user._id,
        };

        if (sellerId !== 'admin') {
            orderData.seller = sellerId;
        }

        const order = await Order.create(orderData);
        createdOrders.push(order);

        // Update Stock
        for (const i of items) {
            await updateStock(i.product, i.quantity);
        }

        // Link order to seller
        if (sellerId !== 'admin') {
            const Seller = require('../models/sellerModel');
            await Seller.findByIdAndUpdate(sellerId, {
                $push: { orders: order._id }
            });
        }
    }

    res.status(201).json({
        success: true,
        orders: createdOrders,
    });
});

// Endpoint to upload prescription file
exports.uploadPrescription = asyncErrorHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorHandler("Please upload a file", 400));
    }
    const prescriptionUrl = `uploads/${req.file.filename}`;

    res.status(200).json({
        success: true,
        url: prescriptionUrl
    });
});

// Get Single Order Details
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id)
        .populate("user", "name email")
        .populate("seller", "name companyName");

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});


// Get Logged In User Orders
exports.myOrders = asyncErrorHandler(async (req, res, next) => {

    const orders = await Order.find({ user: req.user._id })
        .populate("seller", "name companyName");

    if (!orders) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});


// Get All Orders ---ADMIN
// Get All Orders ---ADMIN/SELLER
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {

    let orders;
    if (req.user.role === 'seller') {
        orders = await Order.find({ seller: req.user.id })
            .populate('user', 'name email')
            .populate('seller', 'name companyName');
    } else {
        orders = await Order.find()
            .populate('user', 'name email')
            .populate('seller', 'name companyName');
    }

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        orders,
        totalAmount,
    });
});

// Update Order Status ---ADMIN
// Update Order Status ---ADMIN/SELLER
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    // Verify ownership
    if (req.user.role === 'seller' && order.seller && order.seller.toString() !== req.user.id) {
        return next(new ErrorHandler("Not authorized to manage this order", 403));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("Already Delivered", 400));
    }

    if (req.body.status === "Shipped") {
        order.shippedAt = Date.now();
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
    }

    if (req.body.paymentStatus) {
        order.paymentInfo.status = req.body.paymentStatus;
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
}

// Cancel Order ---USER
exports.cancelOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    if (order.orderStatus === "Delivered" || order.orderStatus === "Shipped" || order.orderStatus === "Cancelled") {
        return next(new ErrorHandler(`Order cannot be cancelled. current status: ${order.orderStatus}`, 400));
    }

    // Update Stock
    for (const item of order.orderItems) {
        await restockProduct(item.product, item.quantity);
    }

    order.orderStatus = "Cancelled";
    await order.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "Order Cancelled Successfully",
    });
});

async function restockProduct(id, quantity) {
    const product = await Product.findById(id);
    product.stock += quantity;
    await product.save({ validateBeforeSave: false });
}

// Delete Order ---ADMIN
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    await order.remove();

    res.status(200).json({
        success: true,
    });
});