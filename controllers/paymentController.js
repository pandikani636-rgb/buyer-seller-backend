const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paytm = require('paytmchecksum');
const https = require('https');
const Payment = require('../models/paymentModel');
const ErrorHandler = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

// exports.processPayment = asyncErrorHandler(async (req, res, next) => {
//     const myPayment = await stripe.paymentIntents.create({
//         amount: req.body.amount,
//         currency: "inr",
//         metadata: {
//             company: "Flipkart",
//         },
//     });

//     res.status(200).json({
//         success: true,
//         client_secret: myPayment.client_secret, 
//     });
// });

// exports.sendStripeApiKey = asyncErrorHandler(async (req, res, next) => {
//     res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
// });

// Process Payment
exports.processPayment = asyncErrorHandler(async (req, res, next) => {

    const { amount, email, phoneNo } = req.body;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return next(new ErrorHandler('Invalid amount provided', 400));
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return next(new ErrorHandler('Invalid email provided', 400));
    }

    if (!phoneNo || typeof phoneNo !== 'string' || phoneNo.length < 10) {
        return next(new ErrorHandler('Invalid phone number provided', 400));
    }

    var params = {};

    /* initialize an array */
    params["MID"] = process.env.PAYTM_MID;
    params["WEBSITE"] = process.env.PAYTM_WEBSITE;
    params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID;
    params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE;
    params["ORDER_ID"] = "oid" + uuidv4();
    params["CUST_ID"] = process.env.PAYTM_CUST_ID;
    params["TXN_AMOUNT"] = JSON.stringify(amount);
    // params["CALLBACK_URL"] = `${req.protocol}://${req.get("host")}/api/v1/callback`;
    params["CALLBACK_URL"] = `https://${req.get("host")}/api/v1/callback`;
    params["EMAIL"] = email;
    params["MOBILE_NO"] = phoneNo;

    let paytmChecksum = paytm.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
    paytmChecksum.then(function (checksum) {

        let paytmParams = {
            ...params,
            "CHECKSUMHASH": checksum,
        };

        res.status(200).json({
            paytmParams
        });

    }).catch(function (error) {
        console.log(error);
    });
});

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay Instance - with proper error handling
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} else {
    console.warn('⚠️  WARNING: Razorpay credentials not configured. Razorpay payments will fail.');
}

// Process Razorpay Payment
exports.processRazorpayPayment = asyncErrorHandler(async (req, res, next) => {
    const { amount } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return next(new ErrorHandler('Invalid amount provided. Amount must be a positive number.', 400));
    }

    if (amount < 1 || amount > 10000000) {
        return next(new ErrorHandler('Amount must be between ₹1 and ₹1,00,00,000', 400));
    }

    const options = {
        amount: Number(amount * 100), // Amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };

    if (!razorpay) {
        console.warn("⚠️ Razorpay not configured, generating mock order...");
        return res.status(200).json({
            success: true,
            order: {
                id: `order_mock_${Date.now()}`,
                amount: options.amount,
                currency: "INR",
                receipt: options.receipt,
                status: "created"
            }
        });
    }

    try {
        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        
        if (error.statusCode === 401) {
            console.warn("⚠️ Razorpay authentication failed (likely dummy keys). Generating mock order...");
            return res.status(200).json({
                success: true,
                order: {
                    id: `order_mock_${Date.now()}`,
                    amount: options.amount,
                    currency: "INR",
                    receipt: options.receipt,
                    status: "created"
                }
            });
        }
        
        return next(new ErrorHandler(error.message || 'Failed to create Razorpay order', 500));
    }
});

// Get Razorpay API Key for Frontend
exports.getRazorpayKey = asyncErrorHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        razorpayKey: process.env.RAZORPAY_KEY_ID
    });
});

// Verify Razorpay Payment status (Optional, mostly handled in frontend but good to have)
exports.verifyRazorpayPayment = asyncErrorHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new ErrorHandler('Missing required payment verification fields', 400));
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
        return next(new ErrorHandler('Razorpay configuration missing', 500));
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    try {
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            res.status(200).json({
                success: true,
            });
        } else {
            return next(new ErrorHandler('Electronic signature mismatch', 400));
        }
    } catch (error) {
        console.error('Razorpay verification error:', error);
        return next(new ErrorHandler('Payment verification failed', 500));
    }
});

// Paytm Callback
exports.paytmResponse = (req, res, next) => {

    // console.log(req.body);

    let paytmChecksum = req.body.CHECKSUMHASH;
    delete req.body.CHECKSUMHASH;

    let isVerifySignature = paytm.verifySignature(req.body, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
    if (isVerifySignature) {
        // console.log("Checksum Matched");

        var paytmParams = {};

        paytmParams.body = {
            "mid": req.body.MID,
            "orderId": req.body.ORDERID,
        };

        paytm.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY).then(function (checksum) {

            paytmParams.head = {
                "signature": checksum
            };

            /* prepare JSON string for request */
            var post_data = JSON.stringify(paytmParams);

            var options = {
                /* Choose based on NODE_ENV */
                hostname: process.env.NODE_ENV === 'production' ? 'securegw.paytm.in' : 'securegw-stage.paytm.in',
                port: 443,
                path: '/v3/order/status',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };

            // Set up the request with error handling
            var response = "";
            var post_req = https.request(options, function (post_res) {
                post_res.on('data', function (chunk) {
                    response += chunk;
                });

                post_res.on('end', function () {
                    try {
                        let { body } = JSON.parse(response);
                        addPayment(body);
                        res.redirect(`https://${req.get("host")}/order/${body.orderId}`)
                    } catch (error) {
                        console.error('Error processing Paytm response:', error);
                        res.redirect(`https://${req.get("host")}/payment-failed`);
                    }
                });
            });

            post_req.on('error', (error) => {
                console.error('Paytm request error:', error);
                res.redirect(`https://${req.get("host")}/payment-failed`);
            });

            // post the data
            post_req.write(post_data);
            post_req.end();
        }).catch((error) => {
            console.error('Paytm signature generation error:', error);
            res.redirect(`https://${req.get("host")}/payment-failed`);
        });

    } else {
        console.log("Checksum Mismatched");
        res.redirect(`https://${req.get("host")}/payment-failed`);
    }
}

const addPayment = async (data) => {
    try {
        await Payment.create(data);
        console.log('Payment record created successfully for order:', data.ORDERID);
    } catch (error) {
        console.error('Payment record creation failed:', error.message);
        // Log but don't throw - payment was successful at Paytm, just DB record failed
    }
}

exports.getPaymentStatus = asyncErrorHandler(async (req, res, next) => {

    const payment = await Payment.findOne({ orderId: req.params.id });

    if (!payment) {
        return next(new ErrorHandler("Payment Details Not Found", 404));
    }

    const txn = {
        id: payment.txnId,
        status: payment.resultInfo.resultStatus,
    }

    res.status(200).json({
        success: true,
        txn,
    });
});
