const express = require('express');
const router = express.Router();

const {
    checkCartOwner,
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem
} = require('../controllers/cartController');

const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:user_id', authenticateToken, checkCartOwner, getCart);

router.post('/:user_id/items', authenticateToken, checkCartOwner, addToCart);

router.put('/:user_id/items/:cart_item_id', authenticateToken, checkCartOwner, updateCartItem);

router.delete('/:user_id/items/:cart_item_id', authenticateToken, checkCartOwner, removeCartItem);

module.exports = router;