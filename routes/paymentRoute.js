const express = require('express');
const { processPayment, paytmResponse, getPaymentStatus, processRazorpayPayment, verifyRazorpayPayment, getRazorpayKey } = require('../controllers/paymentController');
const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

router.route('/payment/process').post(processPayment);
// router.route('/stripeapikey').get(isAuthenticatedUser, sendStripeApiKey);

router.route('/callback').post(paytmResponse);

router.route('/payment/status/:id').get(isAuthenticatedUser, getPaymentStatus);

router.route('/razorpay/key').get(getRazorpayKey);
router.route('/razorpay/process').post(isAuthenticatedUser, processRazorpayPayment);
router.route('/razorpay/verify').post(isAuthenticatedUser, verifyRazorpayPayment);

module.exports = router;