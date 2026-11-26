const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    registerUser,
    loginUser
} = require('../controllers/userController');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, authorizeRole('admin'), getAllUsers);

router.post('/register', registerUser);

router.post('/login', loginUser);

module.exports = router;