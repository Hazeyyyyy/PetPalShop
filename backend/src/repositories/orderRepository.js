const db = require('../config/database');

const getConnection = async () => {
    return await db.getConnection();
};

const getOwnerById = async (order_id) => {
    const [orders] = await db.query(
        'SELECT user_id FROM orders WHERE order_id = ?',
        [order_id]
    );

    return orders;
};

const getCartByUserId = async (connection, user_id) => {
    const [carts] = await connection.query(
        'SELECT * FROM cart WHERE user_id = ?',
        [user_id]
    );

    return carts;
};

const getCartItems = async (connection, cart_id) => {
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

    return items;
};

const getCouponForUpdate = async (connection, code) => {
    const [coupons] = await connection.query(
        `SELECT *
        FROM coupons
        WHERE coupon_code = ?
        FOR UPDATE`,
        [code]
    );

    return coupons;
};

const createOrder = async (
    connection,
    user_id,
    total_amount,
    coupon_id,
    discount_amount
) => {
    const [result] = await connection.query(
        `INSERT INTO orders
        (user_id, total_amount, coupon_id, discount_amount)
        VALUES (?, ?, ?, ?)`,
        [user_id, total_amount, coupon_id, discount_amount]
    );

    return result;
};

const deductStock = async (connection, item) => {
    const [result] = await connection.query(
        `UPDATE products
        SET stock = stock - ?
        WHERE product_id = ? AND stock >= ?`,
        [item.quantity, item.product_id, item.quantity]
    );

    return result;
};

const createOrderItem = async (connection, order_id, item) => {
    const [result] = await connection.query(
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

    return result;
};

const incrementCouponUsage = async (connection, coupon_id) => {
    const [result] = await connection.query(
        `UPDATE coupons
        SET times_used = times_used + 1
        WHERE coupon_id = ?`,
        [coupon_id]
    );

    return result;
};

const clearCart = async (connection, cart_id) => {
    const [result] = await connection.query(
        'DELETE FROM cart_items WHERE cart_id = ?',
        [cart_id]
    );

    return result;
};

const getByUserId = async (user_id) => {
    const [orders] = await db.query(
        `SELECT * FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC`,
        [user_id]
    );

    return orders;
};

const getById = async (order_id) => {
    const [orders] = await db.query(
        'SELECT * FROM orders WHERE order_id = ?',
        [order_id]
    );

    return orders;
};

const getOrderItems = async (order_id) => {
    const [items] = await db.query(`
        SELECT
            order_items.*,
            products.product_name
        FROM order_items
        JOIN products
        ON order_items.product_id = products.product_id
        WHERE order_items.order_id = ?
    `, [order_id]);

    return items;
};

const getStatusForUpdate = async (connection, order_id) => {
    const [orders] = await connection.query(
        `SELECT order_status
        FROM orders
        WHERE order_id = ?
        FOR UPDATE`,
        [order_id]
    );

    return orders;
};

const updateStatus = async (connection, order_id, order_status) => {
    const [result] = await connection.query(
        `UPDATE orders
        SET order_status = ?
        WHERE order_id = ?`,
        [order_status, order_id]
    );

    return result;
};

module.exports = {
    getConnection,
    getOwnerById,
    getCartByUserId,
    getCartItems,
    getCouponForUpdate,
    createOrder,
    deductStock,
    createOrderItem,
    incrementCouponUsage,
    clearCart,
    getByUserId,
    getById,
    getOrderItems,
    getStatusForUpdate,
    updateStatus
};