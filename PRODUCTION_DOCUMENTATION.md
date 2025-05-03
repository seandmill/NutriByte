# NutriByte Part 2: Production Documentation

## Overview

NutriByte Part 2 introduced several new features and infrastructure optimizations, including: distributed systems architecture, cloud deployment, caching strategies, and CI/CD implementation. These features ensure the application is production-ready, scalable, and meets academic requirements for demonstrating distributed systems concepts.

## Features and Infrastructure

### 1. Distributed Systems Implementation (Node.js Clustering)

NutriByte implements a distributed system architecture using Node.js clustering to maximize CPU utilization and improve application performance:

- **Worker Allocation**: Automatically spawns one worker per CPU core
- **Load Balancing**: Implements a round-robin algorithm to distribute incoming requests
- **Inter-Process Communication (IPC)**: Enables state sharing between primary and worker processes
- **Fault Tolerance**: Includes robust worker monitoring and auto-restart capabilities
- **Request Tracking**: Records and displays which worker handles each request

The cluster implementation can be toggled via the `ENABLE_CLUSTERING` environment variable, allowing for easy comparison between clustered and non-clustered performance.

### 2. Redis Caching

To improve response times and reduce load on external APIs:

- **API Response Caching**: Caches responses from the USDA food data API
- **Configurable Expiration**: TTL-based cache invalidation strategy
- **Error Resilience**: Graceful degradation when cache service is unavailable
- **Middleware Implementation**: Reusable cache middleware for consistent implementation

Cache implementation significantly reduces latency for frequently accessed data, particularly beneficial for search results and detailed food information.

### 3. Cloud Database Migration (MongoDB Atlas)

The application has been migrated from a local MongoDB instance to MongoDB Atlas for improved reliability and scalability:

- **Connection Pooling**: Optimized database connections for concurrent requests
- **Error Handling**: Comprehensive error handling and retry logic
- **Security**: Credentials stored as environment variables
- **Performance**: Reduced latency through geographically optimized cluster selection
- **Monitoring**: Built-in performance and health monitoring

### 4. Heroku Deployment

NutriByte has been deployed to Heroku for production hosting:

- **Process Management**: Configured via `Procfile` for optimal process startup
- **Environment Configuration**: All sensitive information and configuration stored as Heroku environment variables
- **Resource Allocation**: Appropriately sized dynos for application needs
- **Static Asset Delivery**: Optimized for Heroku's ephemeral filesystem

### 5. CI/CD Pipeline (GitHub Actions)

Automated testing and deployment workflow via GitHub Actions:

- **Dependency Installation**: Automatic installation of both frontend and backend dependencies
- **Testing**: Execution of unit, integration, and component tests
- **Linting**: Code quality verification
- **Deployment**: Automatic deployment to Heroku on successful builds
- **Notifications**: Build status notifications

### 6. Testing Framework

Comprehensive testing strategy implemented using Jest:

- **Unit Tests**: Testing individual functions and components
- **Integration Tests**: Testing API endpoints and database interactions
- **Component Tests**: Using React Testing Library for UI testing
- **Mocking**: Implementation of mocks for external dependencies
- **CI Integration**: Tests automatically run as part of the deployment pipeline

### 7. CSV Export

Allow users to export their food logs and analytics data to a CSV file:

- **Export Format**: CSV format with columns for date, food name, serving size, and nutrition information
- **Export Functionality**: Export functionality is available in the analytics dashboard
- **Export Trigger**: Export functionality is triggered by a button click

## Interactive Features

### 1. Cluster Dashboard

A real-time dashboard displaying the distributed system in action:

- **Worker Status**: Shows active/inactive status for each worker
- **Request Distribution**: Displays the number of requests handled by each worker
- **Real-Time Updates**: Live updates via WebSocket connection
- **Academic Explanation**: Detailed explanation of the clustering implementation suitable for academic review

### 2. Compare Items Functionality

Enhanced compare functionality with improved reliability:

- **Image Handling**: Reliable image rendering using `CardMedia` components
- **State Management**: Context-based state management with localStorage persistence
- **Error Handling**: Graceful handling of empty comparison lists and loading states

## Environment Variables

The following environment variables are used for configuration:

```
ENABLE_CLUSTERING=true         # Toggle Node.js clustering
MONGODB_URI=<connection_string> # MongoDB Atlas connection string
USDA_API_KEY=<api_key>         # USDA Food Data API key
REDIS_URL=<redis_url>          # Redis connection URL
REDIS_ENABLED=true             # Enable Redis caching
NODE_ENV=production            # Node environment setting
WORKER_COUNT=3                 # Number of workers to spawn (default: 3)
```

## Technical Decisions and Implementation Details

### Horizontal Scaling

The application is designed for horizontal scaling through:
- Stateless architecture
- Distributed processing (Node.js clustering)
- External caching layer (Redis)
- Cloud database with connection pooling (MongoDB Atlas)

### Memory Optimization

The application employs several strategies to efficiently manage memory usage in Heroku's constrained environment:

- **Limited Worker Allocation**: Configurable worker count via `WORKER_COUNT` environment variable (defaults to 2) to prevent exceeding memory limits
- **Garbage Collection**: Periodic manual garbage collection via the `--expose-gc` Node.js flag
- **Memory Monitoring**: Automated memory usage tracking that gracefully recycles workers when approaching the 512MB limit
- **Redis Memory Management**: 
  - Configurable memory limits (30MB in production)
  - LRU (Least Recently Used) eviction policy for cached items
  - Command queue length limitations
- **Reduced Logging**: Level-based logging system with different verbosity for production and development
- **Update Frequency Optimization**: Reduced worker communication frequency to minimize overhead

### Security Considerations

- No hardcoded secrets or credentials
- Environment variables for all sensitive information
- HTTPS enforcement in production
- Proper CORS configuration
- Input validation and sanitization

### Performance Optimizations

- Optimized Vite build for production
- Asset minification and bundling
- Efficient database queries with proper indexing
- Strategic caching of expensive operations
- Lazy loading of non-critical components
- Server-side compression with Express (gzip/deflate/brotli) for reduced payload sizes
- WebP image format implementation for reduced image sizes (60-80% smaller)
- Optimized critical rendering path for faster Largest Contentful Paint (LCP)
- Advanced image component with responsive loading and format fallbacks
- Aggressive HTTP caching strategy for static assets
- Preloading of critical resources
