const petRepository = require('../repositories/petRepository');

const getPets = async (req, res) => {
    try {
        let pets;

        if (req.user.role === 'admin') {
            pets = await petRepository.getAll();
        } else {
            pets = await petRepository.getByUserId(req.user.user_id);
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
};

const addPet = async (req, res) => {
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

        const result = await petRepository.create(
            req.user.user_id,
            pet_name.trim(),
            pet_type.trim(),
            breed || null,
            age === '' || age === undefined ? null : age,
            size || null
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
};

const updatePet = async (req, res) => {
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

        const result = await petRepository.update(
            id,
            pet_name.trim(),
            pet_type.trim(),
            breed || null,
            age === '' || age === undefined ? null : age,
            size || null,
            req.user.user_id,
            req.user.role === 'admin'
        );

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
};

const deletePet = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid pet ID.'
            });
        }

        const result = await petRepository.deleteById(
            id,
            req.user.user_id,
            req.user.role === 'admin'
        );

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
};

module.exports = {
    getPets,
    addPet,
    updatePet,
    deletePet
};