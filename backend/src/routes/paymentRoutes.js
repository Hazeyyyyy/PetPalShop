const express = require('express');
const router = express.Router();

const {
    checkPaymentOrderOwner,
    createCheckout,
    getPayment,
    reconcilePayment
} = require('../controllers/paymentController');

const {
    authenticateToken
} = require('../middleware/authMiddleware');

router.post(
    '/checkout/:order_id',
    authenticateToken,
    checkPaymentOrderOwner,
    createCheckout
);

router.get(
    '/:order_id',
    authenticateToken,
    checkPaymentOrderOwner,
    getPayment
);

router.post(
    '/reconcile/:order_id',
    authenticateToken,
    checkPaymentOrderOwner,
    reconcilePayment
);

module.exports = router;