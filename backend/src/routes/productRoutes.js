const express = require('express');
const router = express.Router();

const {
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

router.get('/', getAllProducts);

router.post('/', authenticateToken, authorizeRole('admin'), addProduct);

router.put('/:id', authenticateToken, authorizeRole('admin'), updateProduct);

router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteProduct);

module.exports = router;