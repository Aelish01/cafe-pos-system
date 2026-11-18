const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully...'))
    .catch((err) => console.error('Database connection error:', err));

// Routes Import
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const billRoutes = require('./routes/billRoutes');
const userRoutes = require('./routes/userRoutes');

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});