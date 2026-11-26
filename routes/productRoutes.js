const express = require('express');
const router = express.Router();
const db = require('../config/database');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT 
                products.*,
                categories.category_name
            FROM products
            LEFT JOIN categories
            ON products.category_id = categories.category_id
        `);

        res.status(200).json({
            message: 'Products retrieved successfully!',
            products: products
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve products.',
            error: error.message
        });
    }
});

router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const {
            category_id,
            product_name,
            description,
            price,
            stock
        } = req.body;

        if (
            !category_id ||
            !product_name ||
            price === undefined ||
            price === null ||
            price === '' ||
            stock === undefined ||
            stock === null ||
            stock === ''
        ) {
            return res.status(400).json({
                message: 'Please provide category_id, product_name, price, and stock.'
            });
        }

        if (
            isNaN(Number(price)) ||
            isNaN(Number(stock)) ||
            Number(price) <= 0 ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: 'Price must be greater than 0 and stock cannot be negative.'
            });
        }

        const [result] = await db.query(
            `INSERT INTO products
            (category_id, product_name, description, price, stock)
            VALUES (?, ?, ?, ?, ?)`,
            [category_id, product_name, description, price, stock]
        );

        res.status(201).json({
            message: 'Product added successfully!',
            product_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add product.',
            error: error.message
        });
    }
});

router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const {
            product_name,
            description,
            price,
            stock,
            category_id
        } = req.body;

        if (
            !category_id ||
            !product_name ||
            price === undefined ||
            price === null ||
            price === '' ||
            stock === undefined ||
            stock === null ||
            stock === ''
        ) {
            return res.status(400).json({
                message: 'Please provide category_id, product_name, price, and stock.'
            });
        }

        if (
            isNaN(Number(price)) ||
            isNaN(Number(stock)) ||
            Number(price) <= 0 ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: 'Price must be greater than 0 and stock cannot be negative.'
            });
        }

        const [result] = await db.query(
            `UPDATE products
            SET product_name = ?,
                description = ?,
                price = ?,
                stock = ?,
                category_id = ?
            WHERE product_id = ?`,
            [
                product_name,
                description,
                price,
                stock,
                category_id,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        res.status(200).json({
            message: 'Product updated successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update product.',
            error: error.message
        });
    }
});

router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM products WHERE product_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        res.status(200).json({
            message: 'Product deleted successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete product.',
            error: error.message
        });
    }
});

module.exports = router;