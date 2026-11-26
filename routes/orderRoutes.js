const express = require('express');
const router = express.Router();
const db = require('../config/database');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

const checkOrderOwner = async (req, res, next) => {
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
                message: 'Access denied. You cannot access this order.'
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

router.post('/:user_id', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { user_id } = req.params;

        if (Number(user_id) !== Number(req.user.user_id)) {
            return res.status(403).json({
                message: 'Access denied. You can only place your own orders.'
            });
        }

        await connection.beginTransaction();

        const [carts] = await connection.query(
            'SELECT * FROM cart WHERE user_id = ?',
            [user_id]
        );

        if (carts.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Your cart is empty.'
            });
        }

        const cart_id = carts[0].cart_id;

        const [items] = await connection.query(`
            SELECT
                cart_items.product_id,
                cart_items.quantity,
                products.product_name,
                products.price,
                products.stock
            FROM cart_items
            JOIN products
            ON cart_items.product_id = products.product_id
            WHERE cart_items.cart_id = ?
        `, [cart_id]);

        if (items.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Your cart is empty.'
            });
        }

        let total_amount = 0;

        for (let item of items) {
            if (item.quantity > item.stock) {
                await connection.rollback();
                return res.status(400).json({
                    message: `Not enough stock for ${item.product_name}.`
                });
            }

            total_amount += Number(item.price) * item.quantity;
        }

        total_amount = Number(total_amount.toFixed(2));

        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, total_amount)
            VALUES (?, ?)`,
            [user_id, total_amount]
        );

        const order_id = orderResult.insertId;

        for (let item of items) {
            const [stockResult] = await connection.query(
                `UPDATE products
                SET stock = stock - ?
                WHERE product_id = ? AND stock >= ?`,
                [item.quantity, item.product_id, item.quantity]
            );

            if (stockResult.affectedRows === 0) {
                throw new Error(
                    `Not enough stock for ${item.product_name}.`
                );
            }

            await connection.query(
                `INSERT INTO order_items
                (order_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?)`,
                [
                    order_id,
                    item.product_id,
                    item.quantity,
                    item.price
                ]
            );
        }

        await connection.query(
            'DELETE FROM cart_items WHERE cart_id = ?',
            [cart_id]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Order placed successfully!',
            order_id: order_id,
            total_amount: total_amount,
            order_status: 'pending'
        });

    } catch (error) {
        await connection.rollback();

        res.status(500).json({
            message: 'Failed to place order.',
            error: error.message
        });

    } finally {
        connection.release();
    }
});

router.get('/:user_id', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.params;

        if (Number(user_id) !== Number(req.user.user_id)) {
            return res.status(403).json({
                message: 'Access denied. You can only view your own orders.'
            });
        }

        const [orders] = await db.query(
            `SELECT * FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC`,
            [user_id]
        );

        res.status(200).json({
            message: 'Orders retrieved successfully!',
            orders: orders
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve orders.',
            error: error.message
        });
    }
});

router.get('/details/:order_id', authenticateToken, checkOrderOwner, async (req, res) => {
    try {
        const { order_id } = req.params;

        const [orders] = await db.query(
            'SELECT * FROM orders WHERE order_id = ?',
            [order_id]
        );

        const [items] = await db.query(`
            SELECT
                order_items.*,
                products.product_name
            FROM order_items
            JOIN products
            ON order_items.product_id = products.product_id
            WHERE order_items.order_id = ?
        `, [order_id]);

        res.status(200).json({
            message: 'Order details retrieved successfully!',
            order: orders[0],
            items: items
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve order details.',
            error: error.message
        });
    }
});


router.put('/:order_id/status', authenticateToken, authorizeRole('admin'), async (req, res) => {
    let connection;

    try {
        const { order_id } = req.params;
        const { order_status } = req.body;

        const allowedTransitions = {
            processing: ['shipped'],
            shipped: ['delivered']
        };

        if (!['shipped', 'delivered'].includes(order_status)) {
            return res.status(400).json({
                message: 'Invalid order status.'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT order_status
            FROM orders
            WHERE order_id = ?
            FOR UPDATE`,
            [order_id]
        );

        if (orders.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Order not found.'
            });
        }

        const currentStatus = orders[0].order_status;

        const validNextStatuses = allowedTransitions[currentStatus] || [];

        if (!validNextStatuses.includes(order_status)) {
            await connection.rollback();

            return res.status(400).json({
                message: `Cannot change order status from ${currentStatus} to ${order_status}.`
            });
        }

        await connection.query(
            `UPDATE orders
            SET order_status = ?
            WHERE order_id = ?`,
            [order_status, order_id]
        );

        await connection.commit();

        res.status(200).json({
            message: 'Order status updated successfully!',
            previous_status: currentStatus,
            order_status: order_status
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error('Order status update error:', error.message);

        res.status(500).json({
            message: 'Failed to update order status.'
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;