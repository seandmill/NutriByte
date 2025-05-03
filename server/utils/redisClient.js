import { createClient } from "redis";

// Create Redis client
let redisClient;

// Custom logging with levels to reduce output in production
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'warn' : 'info';
const logger = {
  error: (...args) => console.error(...args),
  warn: (...args) => LOG_LEVEL !== 'error' && console.warn(...args),
  info: (...args) => ['info', 'debug'].includes(LOG_LEVEL) && console.log(...args),
  debug: (...args) => LOG_LEVEL === 'debug' && console.log(...args)
};

// Create a dummy client that implements the Redis interface but does nothing
const createDummyClient = () => ({
  get: async () => null,
  set: async () => {},
  del: async () => {},
  isReady: false,
  connect: async () => {},
});

// Initialize Redis client
export const initRedisClient = async () => {
  // Check if Redis is explicitly disabled
  if (process.env.REDIS_ENABLED === "false") {
    logger.info(
      "Redis explicitly disabled via REDIS_ENABLED environment variable"
    );
    return createDummyClient();
  }

  try {
    // Use environment variable for Redis URL if available (for production)
    // Otherwise use default localhost connection
    const redisUrl = process.env.REDISCLOUD_URL || "redis://localhost:6379";

    // Set Redis client options to optimize memory usage
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000, // 5 second connection timeout
        reconnectStrategy: (retries) => {
          // Give up after 3 retries
          if (retries > 3) {
            logger.warn("Redis connection failed after 3 retries");
            return new Error("Redis connection failed after maximum retries");
          }
          // Reconnect after increasing delay (exponential backoff)
          return Math.min(retries * 100, 3000);
        },
      },
      commandsQueueMaxLength: 1000, // Limit command queue length to prevent memory issues
    });

    // Configure Redis client event handlers
    redisClient.on("error", (err) => {
      logger.error("Redis client error:", err);
    });

    redisClient.on("reconnecting", () => {
      logger.info("Redis client reconnecting...");
    });

    await redisClient.connect();

    // Configure Redis server with optimized memory settings
    try {
      // Set memory policy to remove least recently used keys when memory is full
      await redisClient.sendCommand([
        'CONFIG', 'SET', 'maxmemory-policy', 'allkeys-lru'
      ]);
      
      // Only if running in production to avoid affecting local dev environment
      if (process.env.NODE_ENV === 'production') {
        await redisClient.sendCommand([
          'CONFIG', 'SET', 'maxmemory', '30mb'
        ]);
      }
      
      logger.info("Redis memory optimizations applied");
    } catch (configError) {
      // Not critical if this fails (might not have permission on hosted Redis)
      logger.warn("Could not configure Redis memory settings:", configError);
    }

    logger.info("Connected to Redis");

    return redisClient;
  } catch (err) {
    logger.error("Error connecting to Redis:", err);
    return createDummyClient();
  }
};

// Export the Redis client getter
export const getRedisClient = () => {
  if (!redisClient || !redisClient.isReady) {
    logger.warn("Redis client requested but not ready, returning dummy client");
    return createDummyClient();
  }
  return redisClient;
};

// Export a Redis cleanup function
export const closeRedisConnection = async () => {
  if (redisClient && redisClient.isReady) {
    try {
      await redisClient.quit();
      logger.info("Redis connection closed");
    } catch (err) {
      logger.error("Error closing Redis connection:", err);
    }
  }
};

// Clean up the Redis client on process exit
process.on("exit", closeRedisConnection);
