const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Getting all pets
router.get('/', async (req, res) => {
    try {
        const [pets] = await db.query(`
            SELECT pets.*, users.name AS owner_name
            FROM pets
            JOIN users ON pets.user_id = users.user_id
        `);

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

// Adding a new pet
router.post('/', async (req, res) => {
    try {
        const { user_id, pet_name, pet_type, breed, age, size } = req.body;

        if (!user_id || !pet_name || !pet_type) {
            return res.status(400).json({
                message: 'User ID, pet name, and pet type are required.'
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
                user_id,
                pet_name,
                pet_type,
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

// Updating a pet
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { pet_name, pet_type, breed, age, size } = req.body;

        if (!pet_name || !pet_type) {
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
            `UPDATE pets
            SET pet_name = ?, pet_type = ?, breed = ?, age = ?, size = ?
            WHERE pet_id = ?`,
            [
                pet_name,
                pet_type,
                breed || null,
                age === '' || age === undefined ? null : age,
                size || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Pet not found.'
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

// Deleting a pet
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM pets WHERE pet_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Pet not found.'
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