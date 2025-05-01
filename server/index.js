const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:8080', 'http://localhost:5173', 'https://fxgbxbqxchhv-8080.na.app.codingrooms.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-User-Email']
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutribyte')
    .then(() => {
        console.log('✅ Connected to MongoDB');

        // Verify User model exists
        const User = require('./models/User');
        console.log('✅ User model loaded');

        // Verify FoodLog model exists
        const FoodLog = require('./models/FoodLog');
        console.log('✅ FoodLog model loaded');
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/users', require('./routes/userRoutes'));

// Handle API JavaScript file requests that should be modules
app.get('/api/:apiFile.js', (req, res) => {
    const { apiFile } = req.params;
    console.log(`Redirecting API file request for ${apiFile}.js to /`);
    res.redirect('/');
});

// Add proxy for USDA API requests
app.get('/api/foods/search', async (req, res) => {
    try {
        const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
            params: {
                ...req.query,
                api_key: process.env.USDA_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying USDA API request:', error);
        res.status(error.response?.status || 500).json({
            message: 'Error fetching food data',
            error: error.response?.data || error.message
        });
    }
});

app.get('/api/food/:fdcId', async (req, res) => {
    try {
        const response = await axios.get(`https://api.nal.usda.gov/fdc/v1/food/${req.params.fdcId}`, {
            params: {
                ...req.query,
                api_key: process.env.USDA_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying USDA API request:', error);
        res.status(error.response?.status || 500).json({
            message: 'Error fetching food details',
            error: error.response?.data || error.message
        });
    }
});

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server with port conflict handling
const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Please try these solutions:`);
                console.error('1. Kill the process using the port:');
                console.error(`   lsof -i :${PORT} | grep LISTEN`);
                console.error('   kill <PID>');
                console.error('2. Or use a different port:');
                console.error('   PORT=5001 npm run dev');
                process.exit(1);
            } else {
                console.error('Server error:', error);
                process.exit(1);
            }
        });

        // Handle shutdown
        process.on('SIGTERM', () => {
            console.info('SIGTERM signal received. Closing server...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.info('SIGINT signal received. Closing server...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 