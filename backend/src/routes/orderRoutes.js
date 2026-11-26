const express = require('express');
const router = express.Router();

const {
    checkOrderOwner,
    placeOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatus
} = require('../controllers/orderController');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

router.post('/:user_id', authenticateToken, placeOrder);

router.get('/:user_id', authenticateToken, getUserOrders);

router.get('/details/:order_id', authenticateToken, checkOrderOwner, getOrderDetails);

router.put('/:order_id/status', authenticateToken, authorizeRole('admin'), updateOrderStatus);

module.exports = router;