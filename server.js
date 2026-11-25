require('dotenv').config();

const express = require('express');
const cors = require('cors');
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

// Middleware
app.use(cors());
app.use(express.json());

// Main route
app.get('/', (req, res) => {
    res.send('Pet Supplies E-Commerce API is running!');
});

// Products API
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', mayaWebhook);

// Start server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        const connection = await db.getConnection();
        console.log('MySQL database connected successfully!');
        connection.release();
    } catch (error) {
        console.log('Database connection failed:', error.message);
    }
});