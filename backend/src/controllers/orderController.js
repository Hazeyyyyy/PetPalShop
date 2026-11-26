const orderRepository = require('../repositories/orderRepository');
const orderService = require('../services/orderService');

const checkOrderOwner = async (req, res, next) => {
    try {
        const { order_id } = req.params;

        const orders = await orderRepository.getOwnerById(order_id);

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

        const order = await orderService.placeOrder(
            user_id,
            coupon_code
        );

        res.status(201).json({
            message: 'Order placed successfully!',
            ...order
        });

    } catch (error) {
        console.error('Order creation error:', error.message);

        res.status(error.code ? 500 : 400).json({
            message: error.code
                ? 'Failed to place order.'
                : error.message,
            ...(error.code && { error: error.message })
        });
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

        const orders = await orderRepository.getByUserId(user_id);

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

        const orders = await orderRepository.getById(order_id);
        const items = await orderRepository.getOrderItems(order_id);

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
    try {
        const { order_id } = req.params;
        const { order_status } = req.body;

        if (!['shipped', 'delivered'].includes(order_status)) {
            return res.status(400).json({
                message: 'Invalid order status.'
            });
        }

        const result = await orderService.updateOrderStatus(
            order_id,
            order_status
        );

        res.status(200).json({
            message: 'Order status updated successfully!',
            ...result
        });

    } catch (error) {
        console.error('Order status update error:', error.message);

        let statusCode = 400;

        if (error.message === 'Order not found.') {
            statusCode = 404;
        } else if (error.code) {
            statusCode = 500;
        }

        res.status(statusCode).json({
            message: error.code
                ? 'Failed to update order status.'
                : error.message
        });
    }
};

module.exports = {
    checkOrderOwner,
    placeOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatus
};