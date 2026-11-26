const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT user_id, name, email, role, created_at
            FROM users`
        );

        res.status(200).json({
            message: 'Users retrieved successfully!',
            users: users
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve users.',
            error: error.message
        });
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required.'
            });
        }

        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: 'Email is already registered.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)`,
            [name, email, passwordHash]
        );

        res.status(201).json({
            message: 'User registered successfully!',
            user_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({
            message: 'Registration failed.',
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Login failed.',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    registerUser,
    loginUser
};