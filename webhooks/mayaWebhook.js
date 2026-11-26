const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const db = require('../config/database');
const mayaWebhookPublicKeys = require('../config/mayaPublicKeys');

function flattenObject(obj, prefix = '', data = []) {
    Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (
            value === null ||
            value === '' ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0)
        ) {
            return;
        }

        if (typeof value === 'object') {
            flattenObject(value, fullKey, data);
        } else {
            data.push(`${fullKey}=${String(value)}`);
        }
    });

    return data;
}

// Verify Maya webhook signature
function verifyMayaSignature(payload, signatureHeader) {
    if (!signatureHeader) return false;

    const parts = {};

    signatureHeader.split(',').forEach(part => {
        const separator = part.indexOf('=');

        if (separator !== -1) {
            parts[part.substring(0, separator).trim()] =
                part.substring(separator + 1).trim();
        }
    });

    if (!parts.nonce || !parts.v1) return false;

    const flatString = flattenObject(payload).sort().join('&');
    const verifyString = `${flatString}&nonce=${parts.nonce}`;

    return mayaWebhookPublicKeys.some(publicKey => {
        try {
            const verifier = crypto.createVerify('RSA-SHA256');

            verifier.update(verifyString);
            verifier.end();

            return verifier.verify(publicKey, parts.v1, 'hex');

        } catch (error) {
            console.log('Signature verification error:', error.message);
            return false;
        }
    });
}

// Receiving Maya webhook notifications
router.post('/maya', async (req, res) => {

    console.log('Maya webhook notification received!');

    let connection;
    let transactionStarted = false;
    let eventId = null;

    try {
        const signature = req.headers['x-maya-webhook-signature'];
        const timestamp = Number(req.headers['x-maya-webhook-timestamp']);

        if (
            !Number.isFinite(timestamp) ||
            Math.abs(Date.now() - timestamp) > 5 * 60 * 1000
        ) {
            return res.status(401).json({
                message: 'Invalid or expired webhook timestamp.'
            });
        }

        if (!verifyMayaSignature(req.body, signature)) {
            return res.status(401).json({
                message: 'Invalid Maya webhook signature.'
            });
        }

        console.log('Webhook signature verified successfully!');

        const requestReferenceNumber = req.body.requestReferenceNumber;

        const paymentStatus =
            req.body.status || req.body.paymentStatus;

        const amount = Number(
            req.body.amount ??
            req.body.totalAmount?.amount ??
            req.body.totalAmount?.value
        );

        const currency =
            req.body.currency ||
            req.body.totalAmount?.currency;

        if (
            !requestReferenceNumber ||
            !paymentStatus ||
            !Number.isFinite(amount) ||
            currency !== 'PHP'
        ) {
            return res.status(400).json({
                message: 'Invalid payment information.'
            });
        }

        const supportedStatuses = [
            'PAYMENT_SUCCESS',
            'PAYMENT_FAILED',
            'PAYMENT_EXPIRED',
            'PAYMENT_CANCELLED'
        ];

        if (!supportedStatuses.includes(paymentStatus)) {
            return res.status(200).json({
                message: 'Webhook event received.',
                payment_status: paymentStatus
            });
        }

        connection = await db.getConnection();

        const eventKey = `${requestReferenceNumber}:${paymentStatus}`;

        try {
            const [eventResult] = await connection.query(
                `INSERT INTO webhook_events
                (event_key, merchant_reference, event_type, event_payload)
                VALUES (?, ?, ?, ?)`,
                [
                    eventKey,
                    requestReferenceNumber,
                    paymentStatus,
                    JSON.stringify(req.body)
                ]
            );

            eventId = eventResult.insertId;

        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(200).json({
                    message: 'Duplicate webhook event. Already received.'
                });
            }

            throw error;
        }

        console.log('Webhook event saved:', eventId);

        const [payments] = await connection.query(
            `SELECT payments.*, orders.total_amount
            FROM payments
            JOIN orders
            ON payments.order_id = orders.order_id
            WHERE payments.merchant_reference = ?`,
            [requestReferenceNumber]
        );

        if (payments.length === 0) {
            await connection.query(
                `UPDATE webhook_events
                SET processing_status = 'failed'
                WHERE event_id = ?`,
                [eventId]
            );

            return res.status(404).json({
                message: 'Matching payment not found.'
            });
        }

        const payment = payments[0];

        console.log('Matching payment found:', payment.payment_id);

        if (
            Math.round(Number(payment.total_amount) * 100) !==
            Math.round(amount * 100)
        ) {
            await connection.query(
                `UPDATE webhook_events
                SET processing_status = 'failed'
                WHERE event_id = ?`,
                [eventId]
            );

            return res.status(400).json({
                message: 'Payment amount does not match the order.'
            });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        if (paymentStatus === 'PAYMENT_SUCCESS') {

            const [paymentResult] = await connection.query(
                `UPDATE payments
                SET payment_status = 'paid'
                WHERE payment_id = ?
                AND payment_status = 'pending'`,
                [payment.payment_id]
            );

            if (paymentResult.affectedRows === 0) {
                await connection.rollback();
                transactionStarted = false;

                await connection.query(
                    `UPDATE webhook_events
                    SET processing_status = 'processed',
                        processed_at = CURRENT_TIMESTAMP
                    WHERE event_id = ?`,
                    [eventId]
                );

                return res.status(200).json({
                    message: 'Payment notification already processed.'
                });
            }

            await connection.query(
                `UPDATE orders
                SET order_status = 'processing'
                WHERE order_id = ?`,
                [payment.order_id]
            );

            console.log('Payment successfully marked as PAID!');

        } else {

            const [paymentResult] = await connection.query(
                `UPDATE payments
                SET payment_status = 'failed'
                WHERE payment_id = ?
                AND payment_status = 'pending'`,
                [payment.payment_id]
            );

            if (paymentResult.affectedRows === 0) {
                await connection.rollback();
                transactionStarted = false;

                await connection.query(
                    `UPDATE webhook_events
                    SET processing_status = 'processed',
                        processed_at = CURRENT_TIMESTAMP
                    WHERE event_id = ?`,
                    [eventId]
                );

                return res.status(200).json({
                    message: 'Payment notification already processed.'
                });
            }

            const [orderItems] = await connection.query(
                `SELECT product_id, quantity
                FROM order_items
                WHERE order_id = ?`,
                [payment.order_id]
            );

            if (orderItems.length === 0) {
                throw new Error('No order items found for stock restoration.');
            }

            for (const item of orderItems) {
                await connection.query(
                    `UPDATE products
                    SET stock = stock + ?
                    WHERE product_id = ?`,
                    [item.quantity, item.product_id]
                );
            }

            console.log('Product stock successfully restored!');
            console.log('Payment marked as FAILED.');
        }

        await connection.query(
            `UPDATE webhook_events
            SET processing_status = 'processed',
                processed_at = CURRENT_TIMESTAMP
            WHERE event_id = ?`,
            [eventId]
        );

        await connection.commit();
        transactionStarted = false;

        console.log('Maya webhook processed successfully!');

        return res.status(200).json({
            message: 'Maya webhook processed successfully!',
            payment_status: paymentStatus
        });

    } catch (error) {

        if (connection && transactionStarted) {
            await connection.rollback();
            transactionStarted = false;
        }

        if (connection && eventId) {
            try {
                await connection.query(
                    `UPDATE webhook_events
                    SET processing_status = 'failed'
                    WHERE event_id = ?`,
                    [eventId]
                );
            } catch (updateError) {
                console.log('Could not update webhook event status.');
            }
        }

        console.error('Maya webhook error:', error.message);

        return res.status(500).json({
            message: 'Failed to process Maya webhook.'
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;