const express = require('express');
const { newOrder, getSingleOrderDetails, myOrders, getAllOrders, updateOrder, deleteOrder, uploadPrescription, cancelOrder } = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/multer');

const router = express.Router();

router.route('/order/new').post(isAuthenticatedUser, newOrder);
router.post('/order/prescription', isAuthenticatedUser, upload.single('prescription'), uploadPrescription);
router.route('/order/:id').get(isAuthenticatedUser, getSingleOrderDetails);
router.route('/order/cancel/:id').put(isAuthenticatedUser, cancelOrder);
router.route('/orders/me').get(isAuthenticatedUser, myOrders);

router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles("admin", "seller"), getAllOrders);

router.route('/admin/order/:id')
    .put(isAuthenticatedUser, authorizeRoles("admin", "seller"), updateOrder)
    .delete(isAuthenticatedUser, authorizeRoles("admin", "seller"), deleteOrder);

module.exports = router;