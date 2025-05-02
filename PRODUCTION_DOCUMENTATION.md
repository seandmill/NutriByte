# NutriByte Part 2: Production Documentation

## Overview

NutriByte Part 2 introducted several new features and infrastructure optmizations, including: distributed systems architecture, cloud deployment, caching strategies, and CI/CD implementation. These features ensure the application is production-ready, scalable, and meets academic requirements for demonstrating distributed systems concepts.

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
```

## Technical Decisions and Implementation Details

### Horizontal Scaling

The application is designed for horizontal scaling through:
- Stateless architecture
- Distributed processing (Node.js clustering)
- External caching layer (Redis)
- Cloud database with connection pooling (MongoDB Atlas)

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
