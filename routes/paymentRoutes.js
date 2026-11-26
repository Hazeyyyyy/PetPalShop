const express = require('express');
const router = express.Router();
const db = require('../config/database');

const {
    authenticateToken
} = require('../middleware/authMiddleware');

const checkPaymentOrderOwner = async (req, res, next) => {
    try {
        const { order_id } = req.params;

        const [orders] = await db.query(
            'SELECT user_id FROM orders WHERE order_id = ?',
            [order_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Order not found.'
            });
        }

        if (
            req.user.role !== 'admin' &&
            Number(orders[0].user_id) !== Number(req.user.user_id)
        ) {
            return res.status(403).json({
                message: 'Access denied. You cannot access this payment.'
            });
        }

        next();

    } catch (error) {
        res.status(500).json({
            message: 'Failed to verify order ownership.',
            error: error.message
        });
    }
};

router.post(
    '/checkout/:order_id',
    authenticateToken,
    checkPaymentOrderOwner,
    async (req, res) => {
        let connection;
        let transactionStarted = false;

        try {
            const { order_id } = req.params;

            if (!process.env.MAYA_PUBLIC_KEY) {
                return res.status(500).json({
                    message: 'Maya public key is missing from environment variables.'
                });
            }

            const [orders] = await db.query(
                'SELECT * FROM orders WHERE order_id = ?',
                [order_id]
            );

            const order = orders[0];
            const amount = Number(order.total_amount);

            if (order.order_status !== 'pending') {
                return res.status(400).json({
                    message: 'Only pending orders can be paid.'
                });
            }

            if (!Number.isFinite(amount) || amount <= 0) {
                return res.status(400).json({
                    message: 'Invalid order amount.'
                });
            }

            const [existingPayments] = await db.query(
                'SELECT * FROM payments WHERE order_id = ?',
                [order_id]
            );

            let existingPayment = null;

            if (existingPayments.length > 0) {
                existingPayment = existingPayments[0];

                if (existingPayment.payment_status === 'paid') {
                    return res.status(409).json({
                        message: 'This order has already been paid.'
                    });
                }

                if (existingPayment.payment_status === 'pending') {
                    return res.status(409).json({
                        message: 'A pending payment already exists.'
                    });
                }

                if (existingPayment.payment_status !== 'failed') {
                    return res.status(409).json({
                        message: 'This payment cannot be retried.'
                    });
                }
            }

            const referenceNumber =
                `PET-ORDER-${order_id}-${Date.now()}`;

            const mayaResponse = await fetch(
                'https://pg-sandbox.paymaya.com/checkout/v1/checkouts',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization':
                            'Basic ' +
                            Buffer.from(
                                process.env.MAYA_PUBLIC_KEY + ':'
                            ).toString('base64')
                    },
                    body: JSON.stringify({
                        totalAmount: {
                            value: Number(amount.toFixed(2)),
                            currency: 'PHP'
                        },
                        requestReferenceNumber: referenceNumber
                    })
                }
            );

            const mayaData = await mayaResponse.json();

            if (!mayaResponse.ok) {
                console.log('Maya Checkout request failed.');

                return res.status(400).json({
                    message: 'Maya Checkout request failed.'
                });
            }

            if (!mayaData.checkoutId || !mayaData.redirectUrl) {
                return res.status(502).json({
                    message: 'Maya did not return a valid checkout session.'
                });
            }

            let paymentId;

            if (existingPayment) {

                connection = await db.getConnection();

                await connection.beginTransaction();
                transactionStarted = true;

                const [lockedPayments] = await connection.query(
                    `SELECT payment_status
                    FROM payments
                    WHERE payment_id = ?
                    FOR UPDATE`,
                    [existingPayment.payment_id]
                );

                if (
                    lockedPayments.length === 0 ||
                    lockedPayments[0].payment_status !== 'failed'
                ) {
                    await connection.rollback();
                    transactionStarted = false;

                    return res.status(409).json({
                        message: 'This payment is no longer available for retry.'
                    });
                }

                const [orderItems] = await connection.query(
                    `SELECT product_id, quantity
                    FROM order_items
                    WHERE order_id = ?`,
                    [order_id]
                );

                if (orderItems.length === 0) {
                    await connection.rollback();
                    transactionStarted = false;

                    return res.status(400).json({
                        message: 'No order items found.'
                    });
                }

                for (const item of orderItems) {
                    const [stockResult] = await connection.query(
                        `UPDATE products
                        SET stock = stock - ?
                        WHERE product_id = ? AND stock >= ?`,
                        [
                            item.quantity,
                            item.product_id,
                            item.quantity
                        ]
                    );

                    if (stockResult.affectedRows === 0) {
                        await connection.rollback();
                        transactionStarted = false;

                        return res.status(400).json({
                            message: 'Not enough stock to retry this order.'
                        });
                    }
                }

                await connection.query(
                    `UPDATE payments
                    SET payment_status = 'pending',
                        payment_reference = ?,
                        merchant_reference = ?,
                        payment_method = ?
                    WHERE payment_id = ?`,
                    [
                        mayaData.checkoutId,
                        referenceNumber,
                        'Maya Checkout',
                        existingPayment.payment_id
                    ]
                );

                await connection.commit();
                transactionStarted = false;

                paymentId = existingPayment.payment_id;

            } else {

                const [result] = await db.query(
                    `INSERT INTO payments
                    (order_id, payment_method, payment_reference, merchant_reference)
                    VALUES (?, ?, ?, ?)`,
                    [
                        order_id,
                        'Maya Checkout',
                        mayaData.checkoutId,
                        referenceNumber
                    ]
                );

                paymentId = result.insertId;
            }

            res.status(201).json({
                message: existingPayment
                    ? 'Maya Checkout retry created successfully!'
                    : 'Maya Checkout created successfully!',
                payment_id: paymentId,
                order_id: order_id,
                payment_status: 'pending',
                checkout_url: mayaData.redirectUrl
            });

        } catch (error) {

            if (connection && transactionStarted) {
                await connection.rollback();
            }

            console.error('Payment error:', error.message);

            res.status(500).json({
                message: 'Failed to create Maya Checkout.'
            });

        } finally {

            if (connection) {
                connection.release();
            }
        }
    }
);

router.get(
    '/:order_id',
    authenticateToken,
    checkPaymentOrderOwner,
    async (req, res) => {
        try {
            const { order_id } = req.params;

            const [payments] = await db.query(
                `SELECT payments.*, orders.total_amount
                FROM payments
                JOIN orders ON payments.order_id = orders.order_id
                WHERE payments.order_id = ?`,
                [order_id]
            );

            if (payments.length === 0) {
                return res.status(404).json({
                    message: 'Payment not found.'
                });
            }

            res.status(200).json({
                message: 'Payment retrieved successfully!',
                payment: payments[0]
            });

        } catch (error) {
            res.status(500).json({
                message: 'Failed to retrieve payment.',
                error: error.message
            });
        }
    }
);

module.exports = router;