const express = require('express');
const router = express.Router();

const {
    getPets,
    addPet,
    updatePet,
    deletePet
} = require('../controllers/petController');

const {
    authenticateToken
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getPets);

router.post('/', authenticateToken, addPet);

router.put('/:id', authenticateToken, updatePet);

router.delete('/:id', authenticateToken, deletePet);

module.exports = router;