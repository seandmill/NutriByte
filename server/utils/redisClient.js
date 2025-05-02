import { createClient } from 'redis';

// Create Redis client
let redisClient;

// Create a dummy client that implements the Redis interface but does nothing
const createDummyClient = () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
  isReady: false,
  connect: async () => {}
});

// Initialize Redis client
export const initRedisClient = async () => {
  // Check if Redis is explicitly disabled
  if (process.env.REDIS_ENABLED === 'false') {
    console.log('Redis explicitly disabled via REDIS_ENABLED environment variable');
    return createDummyClient();
  }
  
  try {
    // Use environment variable for Redis URL if available (for production)
    // Otherwise use default localhost connection
    const redisUrl = process.env.REDISCLOUD_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000, // 5 second connection timeout
        reconnectStrategy: (retries) => {
          // Give up after 3 retries
          if (retries > 3) {
            console.log('Redis connection failed after 3 retries, giving up');
            return false;
          }
          return Math.min(retries * 100, 3000); // Increasing backoff
        }
      }
    });

    // Set up event handlers
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    // Connect to Redis with a timeout
    const connectPromise = redisClient.connect();
    
    // Add a 5 second timeout to the connect promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
    });
    
    // Race the promises - whichever resolves/rejects first wins
    await Promise.race([connectPromise, timeoutPromise])
      .catch(error => {
        console.error('Redis connection timed out:', error);
        throw error;
      });
    
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    
    // Return dummy client to allow app to function without Redis
    return createDummyClient();
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
