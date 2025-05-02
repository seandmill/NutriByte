import { createClient } from 'redis';

// Create Redis client
let redisClient;

// Initialize Redis client
export const initRedisClient = async () => {
  try {
    // Use environment variable for Redis URL if available (for production)
    // Otherwise use default localhost connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl
    });

    // Set up event handlers
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    // Connect to Redis
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    
    // Return null client to allow app to function without Redis
    return {
      get: async () => null,
      set: async () => {},
      isReady: false
    };
  }
};

// Get the Redis client (or create it if it doesn't exist)
export const getRedisClient = () => {
  if (!redisClient || !redisClient.isReady) {
    console.warn('⚠️ Redis client not initialized or not ready, creating a new one');
    return initRedisClient();
  }
  return redisClient;
};

// Clean up the Redis client on process exit
process.on('exit', () => {
  if (redisClient && redisClient.isReady) {
    console.log('Closing Redis connection');
    redisClient.quit();
  }
});
