const db = require('../config/database');

const getConnection = async () => {
    return await db.getConnection();
};

const createEvent = async (connection, eventKey, reference, status, payload) => {
    const [result] = await connection.query(
        `INSERT INTO webhook_events
        (event_key, merchant_reference, event_type, event_payload)
        VALUES (?, ?, ?, ?)`,
        [
            eventKey,
            reference,
            status,
            JSON.stringify(payload)
        ]
    );

    return result;
};

const getPaymentByMerchantReference = async (connection, reference) => {
    const [payments] = await connection.query(
        `SELECT payments.*, orders.total_amount
        FROM payments
        JOIN orders
        ON payments.order_id = orders.order_id
        WHERE payments.merchant_reference = ?`,
        [reference]
    );

    return payments;
};

const updateEventStatus = async (connection, event_id, status) => {
    const [result] = await connection.query(
        `UPDATE webhook_events
        SET processing_status = ?
        WHERE event_id = ?`,
        [status, event_id]
    );

    return result;
};

const markEventAsProcessed = async (connection, event_id) => {
    const [result] = await connection.query(
        `UPDATE webhook_events
        SET processing_status = 'processed',
            processed_at = CURRENT_TIMESTAMP
        WHERE event_id = ?`,
        [event_id]
    );

    return result;
};

const updatePaymentStatus = async (connection, payment_id, status) => {
    const [result] = await connection.query(
        `UPDATE payments
        SET payment_status = ?
        WHERE payment_id = ?
        AND payment_status = 'pending'`,
        [status, payment_id]
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

const getOrderItems = async (connection, order_id) => {
    const [items] = await connection.query(
        `SELECT product_id, quantity
        FROM order_items
        WHERE order_id = ?`,
        [order_id]
    );

    return items;
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

module.exports = {
    getConnection,
    createEvent,
    getPaymentByMerchantReference,
    updateEventStatus,
    markEventAsProcessed,
    updatePaymentStatus,
    updateOrderToProcessing,
    getOrderItems,
    restoreStock
};