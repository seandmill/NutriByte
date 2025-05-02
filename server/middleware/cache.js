import { getRedisClient } from '../utils/redisClient.js';

// Default cache duration in seconds (30 minutes)
const DEFAULT_CACHE_DURATION = 1800;

/**
 * Middleware to cache API responses in Redis
 * @param {Number} duration - Cache duration in seconds
 */
export const cacheMiddleware = (duration = DEFAULT_CACHE_DURATION) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a unique cache key based on the request URL and parameters
    const cacheKey = `api:${req.originalUrl}`;
    
    try {
      // Get Redis client
      const redisClient = await getRedisClient();
      
      // If Redis isn't available, bypass caching
      if (!redisClient || !redisClient.isReady) {
        console.warn('⚠️ Redis not available, bypassing cache');
        return next();
      }

      // Check if the response is already cached
      const cachedResponse = await redisClient.get(cacheKey);
      
      if (cachedResponse) {
        console.log(`✅ Cache hit for ${cacheKey}`);
        // Parse the cached response and send it
        const parsedResponse = JSON.parse(cachedResponse);
        return res.status(200).json(parsedResponse);
      }

      console.log(`❌ Cache miss for ${cacheKey}`);
      
      // If not in cache, store the original res.json method and override it
      const originalJson = res.json;
      
      // Override the res.json method to cache the response before returning it
      res.json = function(data) {
        // Reset json to original to avoid recursion issues
        res.json = originalJson;
        
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Store the response in Redis with the specified expiration
          redisClient.set(cacheKey, JSON.stringify(data), {
            EX: duration
          }).catch(err => {
            console.error('Failed to cache response:', err);
          });
        }
        
        // Call the original json method to send the response
        return res.json(data);
      };
      
      // Continue to the next middleware
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // If there's an error with caching, bypass it
      next();
    }
  };
};

/**
 * Utility to manually clear specific cache entries
 * @param {String} pattern - Pattern to match keys to clear
 */
export const clearCache = async (pattern) => {
  try {
    const redisClient = await getRedisClient();
    
    if (!redisClient || !redisClient.isReady) {
      console.warn('⚠️ Redis not available, cannot clear cache');
      return;
    }
    
    const keys = await redisClient.keys(`api:${pattern || '*'}`);
    
    if (keys.length > 0) {
      console.log(`Clearing ${keys.length} cache entries`);
      await Promise.all(keys.map(key => redisClient.del(key)));
    } else {
      console.log('No cache entries found to clear');
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};
