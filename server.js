require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const db = require('./config/database');

const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const mayaWebhook = require('./webhooks/mayaWebhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many requests. Please try again later.'
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many login or registration attempts. Please try again later.'
    }
});

// Main route
app.get('/', (req, res) => {
    res.send('Pet Supplies E-Commerce API is running!');
});

app.use('/api/webhooks', mayaWebhook);

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

app.use('/api', apiLimiter);

// API routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        const connection = await db.getConnection();

        console.log('MySQL database connected successfully!');

        connection.release();

    } catch (error) {
        console.log('Database connection failed:', error);
    }
});