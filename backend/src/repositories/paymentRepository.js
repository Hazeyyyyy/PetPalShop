const db = require('../config/database');

const getConnection = async () => {
    return await db.getConnection();
};

const getOrderOwner = async (order_id) => {
    const [orders] = await db.query(
        'SELECT user_id FROM orders WHERE order_id = ?',
        [order_id]
    );

    return orders;
};

const getOrderById = async (order_id) => {
    const [orders] = await db.query(
        'SELECT * FROM orders WHERE order_id = ?',
        [order_id]
    );

    return orders;
};

const getByOrderId = async (order_id) => {
    const [payments] = await db.query(
        'SELECT * FROM payments WHERE order_id = ?',
        [order_id]
    );

    return payments;
};

const getPaymentWithOrderAmount = async (order_id) => {
    const [payments] = await db.query(
        `SELECT payments.*, orders.total_amount
        FROM payments
        JOIN orders ON payments.order_id = orders.order_id
        WHERE payments.order_id = ?`,
        [order_id]
    );

    return payments;
};

const getPaymentForUpdate = async (connection, payment_id) => {
    const [payments] = await connection.query(
        `SELECT payment_status
        FROM payments
        WHERE payment_id = ?
        FOR UPDATE`,
        [payment_id]
    );

    return payments;
};

const getOrderItems = async (connection, order_id) => {
    const [items] = await connection.query(
        `SELECT product_id, quantity
        FROM order_items
        WHERE order_id = ?`,
        [order_id]
    );

    return items;
};

const deductStock = async (connection, item) => {
    const [result] = await connection.query(
        `UPDATE products
        SET stock = stock - ?
        WHERE product_id = ? AND stock >= ?`,
        [
            item.quantity,
            item.product_id,
            item.quantity
        ]
    );

    return result;
};

const restoreStock = async (connection, item) => {
    const [result] = await connection.query(
        `UPDATE products
        SET stock = stock + ?
        WHERE product_id = ?`,
        [
            item.quantity,
            item.product_id
        ]
    );

    return result;
};

const updatePaymentForRetry = async (
    connection,
    checkoutId,
    referenceNumber,
    payment_id
) => {
    const [result] = await connection.query(
        `UPDATE payments
        SET payment_status = 'pending',
            payment_reference = ?,
            merchant_reference = ?,
            payment_method = ?
        WHERE payment_id = ?`,
        [
            checkoutId,
            referenceNumber,
            'Maya Checkout',
            payment_id
        ]
    );

    return result;
};

const create = async (
    order_id,
    payment_reference,
    merchant_reference
) => {
    const [result] = await db.query(
        `INSERT INTO payments
        (order_id, payment_method, payment_reference, merchant_reference)
        VALUES (?, ?, ?, ?)`,
        [
            order_id,
            'Maya Checkout',
            payment_reference,
            merchant_reference
        ]
    );

    return result;
};

const markAsPaid = async (connection, payment_id) => {
    const [result] = await connection.query(
        `UPDATE payments
        SET payment_status = 'paid'
        WHERE payment_id = ?`,
        [payment_id]
    );

    return result;
};

const markAsFailed = async (connection, payment_id) => {
    const [result] = await connection.query(
        `UPDATE payments
        SET payment_status = 'failed'
        WHERE payment_id = ?`,
        [payment_id]
    );

    return result;
};

const updateOrderToProcessing = async (connection, order_id) => {
    const [result] = await connection.query(
        `UPDATE orders
        SET order_status = 'processing'
        WHERE order_id = ?`,
        [order_id]
    );

    return result;
};

module.exports = {
    getConnection,
    getOrderOwner,
    getOrderById,
    getByOrderId,
    getPaymentWithOrderAmount,
    getPaymentForUpdate,
    getOrderItems,
    deductStock,
    restoreStock,
    updatePaymentForRetry,
    create,
    markAsPaid,
    markAsFailed,
    updateOrderToProcessing
};