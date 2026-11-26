const express = require('express');
const router = express.Router();
const db = require('../config/database');

const { authenticateToken } = require('../middleware/authMiddleware');

const checkCartOwner = (req, res, next) => {
    const { user_id } = req.params;

    if (Number(user_id) !== Number(req.user.user_id)) {
        return res.status(403).json({
            message: 'Access denied. You can only access your own cart.'
        });
    }

    next();
};

router.get('/:user_id', authenticateToken, checkCartOwner, async (req, res) => {
    try {
        const { user_id } = req.params;

        const [carts] = await db.query(
            'SELECT * FROM cart WHERE user_id = ?',
            [user_id]
        );

        if (carts.length === 0) {
            return res.status(200).json({
                message: 'Cart is empty.',
                items: []
            });
        }

        const cart_id = carts[0].cart_id;

        const [items] = await db.query(`
            SELECT
                cart_items.cart_item_id,
                cart_items.product_id,
                products.product_name,
                products.price,
                cart_items.quantity,
                (products.price * cart_items.quantity) AS subtotal
            FROM cart_items
            JOIN products
            ON cart_items.product_id = products.product_id
            WHERE cart_items.cart_id = ?
        `, [cart_id]);

        res.status(200).json({
            message: 'Cart retrieved successfully!',
            cart_id: cart_id,
            items: items
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve cart.',
            error: error.message
        });
    }
});

router.post('/:user_id/items', authenticateToken, checkCartOwner, async (req, res) => {
    try {
        const { user_id } = req.params;
        const { product_id, quantity } = req.body;

        if (
            !Number.isInteger(Number(product_id)) ||
            Number(product_id) <= 0 ||
            quantity === undefined ||
            quantity === null ||
            quantity === '' ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                message: 'Valid product ID and positive whole-number quantity are required.'
            });
        }

        const [products] = await db.query(
            'SELECT * FROM products WHERE product_id = ?',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        const product = products[0];

        const [carts] = await db.query(
            'SELECT * FROM cart WHERE user_id = ?',
            [user_id]
        );

        let cart_id;

        if (carts.length === 0) {
            const [newCart] = await db.query(
                'INSERT INTO cart (user_id) VALUES (?)',
                [user_id]
            );

            cart_id = newCart.insertId;
        } else {
            cart_id = carts[0].cart_id;
        }

        const [existingItems] = await db.query(
            `SELECT * FROM cart_items
            WHERE cart_id = ? AND product_id = ?`,
            [cart_id, product_id]
        );

        let totalQuantity = Number(quantity);

        if (existingItems.length > 0) {
            totalQuantity += Number(existingItems[0].quantity);
        }

        if (totalQuantity > Number(product.stock)) {
            return res.status(400).json({
                message: 'Not enough stock available.'
            });
        }

        if (existingItems.length > 0) {
            await db.query(
                `UPDATE cart_items
                SET quantity = ?
                WHERE cart_item_id = ?`,
                [totalQuantity, existingItems[0].cart_item_id]
            );
        } else {
            await db.query(
                `INSERT INTO cart_items
                (cart_id, product_id, quantity)
                VALUES (?, ?, ?)`,
                [cart_id, product_id, quantity]
            );
        }

        res.status(201).json({
            message: 'Product added to cart successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add product to cart.',
            error: error.message
        });
    }
});

router.put('/:user_id/items/:cart_item_id', authenticateToken, checkCartOwner, async (req, res) => {
    try {
        const { user_id, cart_item_id } = req.params;
        const { quantity } = req.body;

        if (
            quantity === undefined ||
            quantity === null ||
            quantity === '' ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                message: 'Quantity must be a positive whole number.'
            });
        }

        const [items] = await db.query(`
            SELECT cart_items.*, products.stock
            FROM cart_items
            JOIN cart ON cart_items.cart_id = cart.cart_id
            JOIN products ON cart_items.product_id = products.product_id
            WHERE cart_items.cart_item_id = ?
            AND cart.user_id = ?
        `, [cart_item_id, user_id]);

        if (items.length === 0) {
            return res.status(404).json({
                message: 'Cart item not found.'
            });
        }

        if (Number(quantity) > Number(items[0].stock)) {
            return res.status(400).json({
                message: 'Not enough stock available.'
            });
        }

        await db.query(
            'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
            [quantity, cart_item_id]
        );

        res.status(200).json({
            message: 'Cart quantity updated successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update cart quantity.',
            error: error.message
        });
    }
});

router.delete('/:user_id/items/:cart_item_id', authenticateToken, checkCartOwner, async (req, res) => {
    try {
        const { user_id, cart_item_id } = req.params;

        const [result] = await db.query(`
            DELETE cart_items FROM cart_items
            JOIN cart ON cart_items.cart_id = cart.cart_id
            WHERE cart_items.cart_item_id = ?
            AND cart.user_id = ?
        `, [cart_item_id, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Cart item not found.'
            });
        }

        res.status(200).json({
            message: 'Product removed from cart successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to remove product from cart.',
            error: error.message
        });
    }
});

module.exports = router;