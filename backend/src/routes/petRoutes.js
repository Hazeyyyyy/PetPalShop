const express = require('express');
const router = express.Router();
const db = require('../config/database');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
    try {
        let pets;

        if (req.user.role === 'admin') {
            [pets] = await db.query(`
                SELECT pets.*, users.name AS owner_name
                FROM pets
                JOIN users ON pets.user_id = users.user_id
            `);
        } else {
            [pets] = await db.query(`
                SELECT pets.*, users.name AS owner_name
                FROM pets
                JOIN users ON pets.user_id = users.user_id
                WHERE pets.user_id = ?
            `, [req.user.user_id]);
        }

        res.status(200).json({
            message: 'Pets retrieved successfully!',
            pets: pets
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve pets.',
            error: error.message
        });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { pet_name, pet_type, breed, age, size } = req.body;

        if (
            typeof pet_name !== 'string' ||
            pet_name.trim() === '' ||
            typeof pet_type !== 'string' ||
            pet_type.trim() === ''
        ) {
            return res.status(400).json({
                message: 'Pet name and pet type are required.'
            });
        }

        if (age !== undefined && age !== null && age !== '') {
            if (!Number.isInteger(Number(age)) || Number(age) < 0) {
                return res.status(400).json({
                    message: 'Age must be a non-negative whole number.'
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO pets
            (user_id, pet_name, pet_type, breed, age, size)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.user_id,
                pet_name.trim(),
                pet_type.trim(),
                breed || null,
                age === '' || age === undefined ? null : age,
                size || null
            ]
        );

        res.status(201).json({
            message: 'Pet added successfully!',
            pet_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add pet.',
            error: error.message
        });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { pet_name, pet_type, breed, age, size } = req.body;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid pet ID.'
            });
        }

        if (
            typeof pet_name !== 'string' ||
            pet_name.trim() === '' ||
            typeof pet_type !== 'string' ||
            pet_type.trim() === ''
        ) {
            return res.status(400).json({
                message: 'Pet name and pet type are required.'
            });
        }

        if (age !== undefined && age !== null && age !== '') {
            if (!Number.isInteger(Number(age)) || Number(age) < 0) {
                return res.status(400).json({
                    message: 'Age must be a non-negative whole number.'
                });
            }
        }

        let sql = `
            UPDATE pets
            SET pet_name = ?, pet_type = ?, breed = ?, age = ?, size = ?
            WHERE pet_id = ?
        `;

        let values = [
            pet_name.trim(),
            pet_type.trim(),
            breed || null,
            age === '' || age === undefined ? null : age,
            size || null,
            id
        ];

        if (req.user.role !== 'admin') {
            sql += ' AND user_id = ?';
            values.push(req.user.user_id);
        }

        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Pet not found or you do not have permission to update it.'
            });
        }

        res.status(200).json({
            message: 'Pet updated successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update pet.',
            error: error.message
        });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid pet ID.'
            });
        }

        let sql = 'DELETE FROM pets WHERE pet_id = ?';
        let values = [id];

        if (req.user.role !== 'admin') {
            sql += ' AND user_id = ?';
            values.push(req.user.user_id);
        }

        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Pet not found or you do not have permission to delete it.'
            });
        }

        res.status(200).json({
            message: 'Pet deleted successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete pet.',
            error: error.message
        });
    }
});

module.exports = router;