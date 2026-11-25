const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Getting all categories
router.get('/', async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories'
        );

        res.status(200).json({
            message: 'Categories retrieved successfully!',
            categories: categories
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve categories.',
            error: error.message
        });
    }
});

// Adding a new category
router.post('/', async (req, res) => {
    try {
        const { category_name, description } = req.body;

        if (!category_name || category_name.trim() === '') {
            return res.status(400).json({
                message: 'Category name is required.'
            });
        }

        const [result] = await db.query(
            `INSERT INTO categories (category_name, description)
            VALUES (?, ?)`,
            [category_name.trim(), description || null]
        );

        res.status(201).json({
            message: 'Category added successfully!',
            category_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add category.',
            error: error.message
        });
    }
});

// Updating a category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, description } = req.body;

        if (!category_name || category_name.trim() === '') {
            return res.status(400).json({
                message: 'Category name is required.'
            });
        }

        const [result] = await db.query(
            `UPDATE categories
            SET category_name = ?, description = ?
            WHERE category_id = ?`,
            [category_name.trim(), description || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Category not found.'
            });
        }

        res.status(200).json({
            message: 'Category updated successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update category.',
            error: error.message
        });
    }
});

// Deleting a category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM categories WHERE category_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Category not found.'
            });
        }

        res.status(200).json({
            message: 'Category deleted successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete category.',
            error: error.message
        });
    }
});

module.exports = router;