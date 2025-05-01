const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config();

// Logfor debugging
console.log('USDA API KEY status:', process.env.USDA_API_KEY ? 'Key is set' : 'Key is missing');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:8080', 
        'http://localhost:5173', 
        'https://fxgbxbqxchhv-8080.na.app.codingrooms.com',
        process.env.HEROKU_URL
    ].filter(Boolean),
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

// Serve static files from the React app
// This should come AFTER API routes
// Try multiple potential build output paths based on environment
let clientPath;
const possiblePaths = [
    path.resolve(__dirname, '../dist'),
    path.resolve(process.cwd(), 'dist'),
    '/usercode/dist',
    path.resolve(__dirname, '../../dist'),
    path.resolve(__dirname, '../src/dist'),
    path.resolve(process.cwd(), 'src/dist'),
    '/usercode/src/dist'
];

// Find the first path that exists
for (const testPath of possiblePaths) {
    try {
        if (require('fs').existsSync(testPath)) {
            clientPath = testPath;
            console.log(`Found static files at: ${clientPath}`);
            break;
        }
    } catch (err) {
        console.log(`Path ${testPath} not found or not accessible`);
    }
}

if (!clientPath) {
    console.error('WARNING: Could not find static files directory!');
    console.error('Checked paths:', possiblePaths);
    // Use default path as fallback
    clientPath = path.resolve(__dirname, '../dist');
    console.error(`Falling back to: ${clientPath}`);
}

// Attempt to list directory contents to help debug
try {
    const files = require('fs').readdirSync(process.cwd());
    console.log('Current directory contents:', files);
} catch (err) {
    console.error('Error listing current directory:', err);
}

// Serve the main build directory
app.use(express.static(clientPath));

// Also serve public directory and additional potential asset locations
const publicPaths = [
    path.resolve(__dirname, '../public'),
    path.resolve(process.cwd(), 'public'),
    '/usercode/public',
    path.resolve(__dirname, '../src/public'),
    path.resolve(process.cwd(), 'src/public')
];

// Serve each potential public directory
for (const publicPath of publicPaths) {
    try {
        if (require('fs').existsSync(publicPath)) {
            console.log(`Serving public assets from: ${publicPath}`);
            app.use(express.static(publicPath));
        }
    } catch (err) {
        // Path doesn't exist, skip
    }
}

// Also serve assets directory from build output
app.use('/assets', express.static(path.join(clientPath, 'assets')));

// For any non-API routes, send the React app
// This must be placed AFTER all API routes
app.get('*', (req, res, next) => {
    // Skip API routes - they should be handled by their own handlers
    if (req.path.startsWith('/api/')) {
        return next();
    }

    console.log(`Attempting to serve index.html for path: ${req.path}`);

    // Try to find index.html in various locations
    const possibleIndexPaths = [
        path.resolve(clientPath, 'index.html'),
        path.resolve(process.cwd(), 'dist/index.html'),
        path.resolve(process.cwd(), 'src/index.html'),
        '/usercode/dist/index.html',
        '/usercode/src/index.html',
        path.resolve(process.cwd(), 'src/dist/index.html'),
        '/usercode/src/dist/index.html'
    ];

    for (const indexPath of possibleIndexPaths) {
        try {
            if (require('fs').existsSync(indexPath)) {
                console.log(`Found index.html at: ${indexPath}`);
                return res.sendFile(indexPath);
            }
        } catch (err) {
            console.log(`Index not found at ${indexPath}`);
        }
    }

    // If we get here, we couldn't find index.html
    res.status(404).send('Could not find index.html in any expected location');
});

// General error handling
app.use((err, req, res, next) => {
    console.error('General Error:', err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        const server = app.listen(PORT, () => {
            console.log(`🚀 Integrated server running on port ${PORT}`);
            console.log(`API routes accessible at http://localhost:${PORT}/api/`);
            console.log(`Frontend accessible at http://localhost:${PORT}/`);
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