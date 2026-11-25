const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Creating a new order from the user's cart
router.post('/:user_id', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { user_id } = req.params;

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

// Getting all orders of a user
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

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

// Getting the details of a specific order
router.get('/details/:order_id', async (req, res) => {
    try {
        const { order_id } = req.params;

        const [orders] = await db.query(
            'SELECT * FROM orders WHERE order_id = ?',
            [order_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Order not found.'
            });
        }

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

// Updating order status
router.put('/:order_id/status', async (req, res) => {
    try {
        const { order_id } = req.params;
        const { order_status } = req.body;

        const allowedStatuses = [
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled'
        ];

        if (!allowedStatuses.includes(order_status)) {
            return res.status(400).json({
                message: 'Invalid order status.'
            });
        }

        const [orders] = await db.query(
            'SELECT * FROM orders WHERE order_id = ?',
            [order_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Order not found.'
            });
        }

        await db.query(
            'UPDATE orders SET order_status = ? WHERE order_id = ?',
            [order_status, order_id]
        );

        res.status(200).json({
            message: 'Order status updated successfully!',
            order_status: order_status
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update order status.',
            error: error.message
        });
    }
});

module.exports = router;