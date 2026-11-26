const db = require('../config/database');

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

const placeOrder = async (req, res) => {
    let connection;

    try {
        const { user_id } = req.params;
        const { coupon_code } = req.body;

        if (Number(user_id) !== Number(req.user.user_id)) {
            return res.status(403).json({
                message: 'Access denied. You can only place your own orders.'
            });
        }

        if (
            coupon_code !== undefined &&
            coupon_code !== null &&
            typeof coupon_code !== 'string'
        ) {
            return res.status(400).json({
                message: 'Invalid coupon code.'
            });
        }

        connection = await db.getConnection();
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

        const subtotal = Number(total_amount.toFixed(2));

        let coupon_id = null;
        let discount_amount = 0;

        const code = coupon_code?.trim();

        if (code) {
            const [coupons] = await connection.query(
                `SELECT *
                FROM coupons
                WHERE coupon_code = ?
                FOR UPDATE`,
                [code]
            );

            if (coupons.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'Invalid coupon code.'
                });
            }

            const coupon = coupons[0];

            if (!coupon.is_active) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'This coupon is inactive.'
                });
            }

            if (
                coupon.expiry_date &&
                new Date(coupon.expiry_date) <= new Date()
            ) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'This coupon has expired.'
                });
            }

            if (
                coupon.usage_limit !== null &&
                coupon.times_used >= coupon.usage_limit
            ) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'This coupon has reached its usage limit.'
                });
            }

            if (subtotal < Number(coupon.minimum_order)) {
                await connection.rollback();
                return res.status(400).json({
                    message: `Minimum order amount is ${coupon.minimum_order}.`
                });
            }

            const discount_value = Number(coupon.discount_value);

            if (
                !Number.isFinite(discount_value) ||
                discount_value <= 0 ||
                (
                    coupon.discount_type === 'percentage' &&
                    discount_value > 100
                )
            ) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'This coupon has an invalid discount value.'
                });
            }

            if (coupon.discount_type === 'percentage') {
                discount_amount = subtotal * (discount_value / 100);
            } else if (coupon.discount_type === 'fixed') {
                discount_amount = discount_value;
            } else {
                await connection.rollback();
                return res.status(400).json({
                    message: 'Invalid coupon discount type.'
                });
            }

            discount_amount = Number(
                Math.min(discount_amount, subtotal).toFixed(2)
            );

            coupon_id = coupon.coupon_id;
        }

        total_amount = Number(
            (subtotal - discount_amount).toFixed(2)
        );

        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (user_id, total_amount, coupon_id, discount_amount)
            VALUES (?, ?, ?, ?)`,
            [user_id, total_amount, coupon_id, discount_amount]
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

        if (coupon_id !== null) {
            await connection.query(
                `UPDATE coupons
                SET times_used = times_used + 1
                WHERE coupon_id = ?`,
                [coupon_id]
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
            subtotal: subtotal,
            discount_amount: discount_amount,
            total_amount: total_amount,
            coupon_id: coupon_id,
            order_status: 'pending'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Order creation error:', error.message);

        res.status(500).json({
            message: 'Failed to place order.',
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getUserOrders = async (req, res) => {
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
};

const getOrderDetails = async (req, res) => {
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
};

const updateOrderStatus = async (req, res) => {
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
};

module.exports = {
    checkOrderOwner,
    placeOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatus
};