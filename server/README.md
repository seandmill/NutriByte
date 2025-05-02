# NutriByte Backend Server

This directory contains the backend Express.js server for the NutriByte nutrition tracking application. The server provides API endpoints for user authentication, food logging, and user configuration, along with production-ready features like clustering, caching, and cloud database integration.

## Server Structure

```
server/
├── middleware/           # Express middleware
│   ├── auth.js           # Authentication middleware
│   └── cache.js          # Redis caching middleware
├── models/               # Mongoose data models
│   ├── FoodLog.js        # Schema for food logging
│   └── User.js           # Schema for user data
├── routes/               # API route handlers
│   ├── auth.js           # Authentication routes
│   ├── logs.js           # Food logging routes
│   └── userRoutes.js     # User configuration routes
├── utils/
│   └── redisClient.js    # Redis connection utilities
├── cluster.js            # Node.js clustering implementation
├── index.js              # Main server entry point
├── integrated.js         # Combined server for production
└── package.json          # Server dependencies
```

## Backend Architecture

The server follows a modern, production-ready architecture:
1. **Models**: Define data schemas using Mongoose connected to MongoDB Atlas
2. **Routes**: Handle API endpoints and business logic
3. **Middleware**: Process requests with authentication and caching
4. **Clustering**: Distribute requests across multiple Node.js workers
5. **Caching**: Redis-based response caching for improved performance

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email
- `POST /api/auth/signup` - Create new user
- `GET /api/auth/verify` - Verify current session

### Food Logs
- `GET /api/logs` - Get all logs for current user
- `POST /api/logs` - Create new food log entry
- `GET /api/logs/:id` - Get specific log
- `PUT /api/logs/:id` - Update existing log
- `DELETE /api/logs/:id` - Delete log

### User Configuration
- `GET /api/users/config` - Get user nutrition settings
- `PUT /api/users/config` - Update user nutrition settings

## USDA API Integration

The integrated server proxies requests to the USDA Food Data Central API to:
- Provide food search capabilities
- Fetch detailed nutrition information
- Handle API key management on the server side

## Running the Server

### Development

```bash
# Install dependencies
npm install

# Start with nodemon for development
npm run dev
```

### Production

```bash
# Install dependencies
npm install

# Start server
npm start
```

### Integrated Mode (for ZyBooks)

The `integrated.js` file combines the Express backend with serving the React frontend static files. This allows the entire application to run on a single port (8080), which is required for the ZyBooks environment.

To run in integrated mode from the project root:
```bash
npm run zybooks
```

## Environment Variables

The server requires these environment variables:
- `PORT`: Server port (default: 8080) 
- `MONGODB_URI`: MongoDB connection string (points to MongoDB Atlas in production)
- `USDA_API_KEY`: API key for USDA Food Data Central
- `ENABLE_CLUSTERING`: Set to 'true' to enable Node.js clustering
- `REDIS_ENABLED`: Set to 'true' to enable Redis caching
- `REDISCLOUD_URL`: Redis connection URL for caching (production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## Database Models

### User Model
Stores user profiles and nutrition preferences:
- Basic info (name, email)
- Custom nutrition targets
- Preferred daily values for nutrients

### FoodLog Model
Stores food consumption records:
- Food details (name, serving size, brand)
- Complete nutrition data
- Timestamps and log type (consumed, avoided, prepped)

## Implementation Notes

- Session-based authentication for simplicity in educational context
- MongoDB aggregation for nutrition analytics
- Proxy implementation for external API calls with Redis caching
- Proper error handling and validation
- Horizontal scaling via Node.js clustering
- Performance optimization with Redis caching
- Cloud database integration with MongoDB Atlas

## Production Features

### Distributed Systems (Node.js Clustering)

The server implements a distributed system architecture using Node.js clustering:

- Spawns one worker per CPU core automatically
- Uses round-robin load balancing for request distribution
- Implements inter-process communication for state sharing
- Includes worker monitoring and auto-restart capabilities
- Tracks requests per worker for analysis

### Redis Caching

Performance optimization with Redis:

- Caches USDA API responses to reduce external API calls
- Configurable TTL-based cache expiration
- Graceful fallback when cache is unavailable
- Significant performance improvements for repeated queries

### Cloud Database Integration

- Migrated from local MongoDB to MongoDB Atlas
- Optimized connection pooling for concurrent requests
- Comprehensive error handling and retry logic
- Secure credential management via environment variables