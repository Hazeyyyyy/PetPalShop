const orderRepository = require('../repositories/orderRepository');

const placeOrder = async (user_id, coupon_code) => {
    const connection = await orderRepository.getConnection();

    try {
        await connection.beginTransaction();

        const carts = await orderRepository.getCartByUserId(
            connection,
            user_id
        );

        if (carts.length === 0) {
            throw new Error('Your cart is empty.');
        }

        const cart_id = carts[0].cart_id;

        const items = await orderRepository.getCartItems(
            connection,
            cart_id
        );

        if (items.length === 0) {
            throw new Error('Your cart is empty.');
        }

        let subtotal = 0;

        for (let item of items) {
            if (item.quantity > item.stock) {
                throw new Error(
                    `Not enough stock for ${item.product_name}.`
                );
            }

            subtotal += Number(item.price) * item.quantity;
        }

        subtotal = Number(subtotal.toFixed(2));

        let coupon_id = null;
        let discount_amount = 0;

        const code = coupon_code?.trim();

        if (code) {
            const coupons = await orderRepository.getCouponForUpdate(
                connection,
                code
            );

            if (coupons.length === 0) {
                throw new Error('Invalid coupon code.');
            }

            const coupon = coupons[0];

            if (!coupon.is_active) {
                throw new Error('This coupon is inactive.');
            }

            if (
                coupon.expiry_date &&
                new Date(coupon.expiry_date) <= new Date()
            ) {
                throw new Error('This coupon has expired.');
            }

            if (
                coupon.usage_limit !== null &&
                coupon.times_used >= coupon.usage_limit
            ) {
                throw new Error(
                    'This coupon has reached its usage limit.'
                );
            }

            if (subtotal < Number(coupon.minimum_order)) {
                throw new Error(
                    `Minimum order amount is ${coupon.minimum_order}.`
                );
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
                throw new Error(
                    'This coupon has an invalid discount value.'
                );
            }

            if (coupon.discount_type === 'percentage') {
                discount_amount = subtotal * (discount_value / 100);
            } else if (coupon.discount_type === 'fixed') {
                discount_amount = discount_value;
            } else {
                throw new Error('Invalid coupon discount type.');
            }

            discount_amount = Number(
                Math.min(discount_amount, subtotal).toFixed(2)
            );

            coupon_id = coupon.coupon_id;
        }

        const total_amount = Number(
            (subtotal - discount_amount).toFixed(2)
        );

        const orderResult = await orderRepository.createOrder(
            connection,
            user_id,
            total_amount,
            coupon_id,
            discount_amount
        );

        const order_id = orderResult.insertId;

        for (let item of items) {
            const stockResult = await orderRepository.deductStock(
                connection,
                item
            );

            if (stockResult.affectedRows === 0) {
                throw new Error(
                    `Not enough stock for ${item.product_name}.`
                );
            }

            await orderRepository.createOrderItem(
                connection,
                order_id,
                item
            );
        }

        if (coupon_id !== null) {
            await orderRepository.incrementCouponUsage(
                connection,
                coupon_id
            );
        }

        await orderRepository.clearCart(connection, cart_id);

        await connection.commit();

        return {
            order_id,
            subtotal,
            discount_amount,
            total_amount,
            coupon_id,
            order_status: 'pending'
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

const updateOrderStatus = async (order_id, order_status) => {
    const allowedTransitions = {
        processing: ['shipped'],
        shipped: ['delivered']
    };

    const connection = await orderRepository.getConnection();

    try {
        await connection.beginTransaction();

        const orders = await orderRepository.getStatusForUpdate(
            connection,
            order_id
        );

        if (orders.length === 0) {
            throw new Error('Order not found.');
        }

        const currentStatus = orders[0].order_status;

        const validNextStatuses =
            allowedTransitions[currentStatus] || [];

        if (!validNextStatuses.includes(order_status)) {
            throw new Error(
                `Cannot change order status from ${currentStatus} to ${order_status}.`
            );
        }

        await orderRepository.updateStatus(
            connection,
            order_id,
            order_status
        );

        await connection.commit();

        return {
            previous_status: currentStatus,
            order_status
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

module.exports = {
    placeOrder,
    updateOrderStatus
};