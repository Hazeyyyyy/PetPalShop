const express = require('express');
const router = express.Router();

const {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

router.get('/', getAllCategories);

router.post('/', authenticateToken, authorizeRole('admin'), addCategory);

router.put('/:id', authenticateToken, authorizeRole('admin'), updateCategory);

router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteCategory);

module.exports = router;