const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config();

// Log for debugging
console.log('USDA API KEY status:', process.env.USDA_API_KEY ? 'Key is set' : 'Key is missing');

const app = express();

// CORS configuration based on environment
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || [process.env.HEROKU_URL]
        : ['http://localhost:8080', 'http://localhost:5173'],
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
mongoose.connect(process.env.MONGODB_URI)
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
        // Ensure API key is available - Modify this with your actual key if needed
        const apiKey = process.env.USDA_API_KEY;
        console.log('Using API Key for food search:', apiKey.substring(0, 3) + '...');

        // Construct request parameters including the API key
        const requestParams = {
            ...req.query,
            api_key: apiKey
        };

        console.log('Food search request params:', JSON.stringify(requestParams));

        const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
            params: requestParams
        });

        console.log('USDA API search response status:', response.status);
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying USDA API search request:', error);
        console.error('Request details:', error.config?.url, error.config?.params);
        res.status(error.response?.status || 500).json({
            message: 'Error fetching food data',
            error: error.response?.data || error.message
        });
    }
});

app.get('/api/food/:fdcId', async (req, res) => {
    try {
        // Ensure API key is available - Modify this with your actual key if needed
        const apiKey = process.env.USDA_API_KEY;
        console.log('Using API Key for food detail:', apiKey.substring(0, 3) + '...');

        // Construct request parameters including the API key
        const requestParams = {
            ...req.query,
            api_key: apiKey
        };

        console.log(`Food detail request for ID ${req.params.fdcId} with params:`, JSON.stringify(requestParams));

        const response = await axios.get(`https://api.nal.usda.gov/fdc/v1/food/${req.params.fdcId}`, {
            params: requestParams
        });

        console.log('USDA API detail response status:', response.status);
        res.json(response.data);
    } catch (error) {
        console.error(`Error proxying USDA API detail request for ID ${req.params.fdcId}:`, error);
        console.error('Request details:', error.config?.url, error.config?.params);
        res.status(error.response?.status || 500).json({
            message: 'Error fetching food details',
            error: error.response?.data || error.message
        });
    }
});

// Basic error handling middleware for API routes
app.use('/api', (err, req, res, next) => {
    console.error('API Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong with the API!' });
});

// Simplified static file serving for production
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
    // In production, serve from the dist directory at project root
    const clientPath = path.resolve(process.cwd(), 'dist');
    console.log('Serving static files from:', clientPath);
    
    // Debug: List contents of current and dist directories
    try {
        console.log('Current directory:', process.cwd());
        console.log('Current directory contents:', require('fs').readdirSync(process.cwd()));
        console.log('Dist directory contents:', require('fs').readdirSync(clientPath));
    } catch (err) {
        console.error('Error listing directories:', err);
    }
    
    // Serve the main build directory
    app.use(express.static(clientPath));
    
    // Serve assets directory from build output
    app.use('/assets', express.static(path.join(clientPath, 'assets')));
    
    // For any non-API routes, send the React app
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return next();
        }
        const indexPath = path.join(clientPath, 'index.html');
        if (require('fs').existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            console.error('index.html not found at:', indexPath);
            res.status(404).send('Could not find index.html');
        }
    });
} else {
    console.log('Static file serving disabled - development mode');
}

// General error handling
app.use((err, req, res, next) => {
    console.error('General Error:', err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server with dynamic port
const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`API routes accessible at http://localhost:${PORT}/api/`);
                console.log(`Frontend accessible at http://localhost:${PORT}/`);
            }
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