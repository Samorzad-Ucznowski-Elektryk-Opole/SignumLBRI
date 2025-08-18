import Redis from 'ioredis';

/**
 * High-performance Redis cache system for SignumLBRI 2025
 */
class CacheManager {
  private redis: Redis | null = null;
  private localCache: Map<string, { data: any; expires: number }> = new Map();
  private readonly LOCAL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes local cache

  constructor() {
    // For now, just use local cache - Redis can be added later
    console.log('� Using local cache only (Redis disabled)');

    // Cleanup local cache periodically
    setInterval(() => this.cleanupLocalCache(), 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Get cached data with fallback to local cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
      }

      // Fallback to local cache
      const localData = this.localCache.get(key);
      if (localData && localData.expires > Date.now()) {
        return localData.data;
      }

      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);

      // Store in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, jsonData);
      }

      // Store in local cache as backup
      this.localCache.set(key, {
        data,
        expires: Date.now() + (Math.min(ttl, this.LOCAL_CACHE_TTL / 1000) * 1000)
      });
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      this.localCache.delete(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear local cache matching pattern
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.localCache.keys()) {
        if (regex.test(key)) {
          this.localCache.delete(key);
        }
      }
    } catch (error) {
      console.error(`Cache pattern delete error for ${pattern}:`, error);
    }
  }

  /**
   * Cache with automatic refresh
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = 3600
  ): Promise<T> {
    let cached = await this.get<T>(key);
    
    if (cached === null) {
      try {
        cached = await fetchFn();
        await this.set(key, cached, ttl);
      } catch (error) {
        console.error(`Cache fetch error for key ${key}:`, error);
        throw error;
      }
    }
    
    return cached;
  }

  /**
   * Cleanup expired local cache entries
   */
  private cleanupLocalCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.localCache.entries()) {
      if (value.expires <= now) {
        this.localCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired local cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      localCacheSize: this.localCache.size,
      redisConnected: this.redis?.status === 'ready'
    };
  }
}

// Cache key generators for different data types
export const CacheKeys = {
  bookAd: (id: string) => `bookad:${id}`,
  bookAdsBySchool: (schoolId: string, page: number) => `bookads:school:${schoolId}:page:${page}`,
  bookAdsByUser: (userId: string) => `bookads:user:${userId}`,
  bookAdSearch: (query: string, filters: string) => `bookads:search:${query}:${filters}`,
  userCart: (userId: string) => `cart:${userId}`,
  userProfile: (userId: string) => `user:${userId}`,
  schoolStats: (schoolId: string) => `stats:school:${schoolId}`,
  bookCover: (bookId: string) => `book:cover:${bookId}`,
  popularBooks: (schoolId: string) => `popular:books:${schoolId}`
};

// Export singleton instance
export const cache = new CacheManager();

/**
 * Middleware for caching responses
 */
export const cacheMiddleware = (keyFn: (req: any) => string, ttl: number = 300) => {
  return async (req: any, res: any, next: any) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyFn(req);
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function(data: any) {
      res.setHeader('X-Cache', 'MISS');
      cache.set(cacheKey, data, ttl).catch(console.error);
      return originalJson(data);
    };

    next();
  };
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  bookAd: async (bookAdId: string) => {
    await cache.delPattern(`bookad:${bookAdId}*`);
    await cache.delPattern('bookads:*');
    await cache.delPattern('popular:*');
  },
  
  user: async (userId: string) => {
    await cache.delPattern(`user:${userId}*`);
    await cache.delPattern(`cart:${userId}*`);
    await cache.delPattern(`bookads:user:${userId}*`);
  },
  
  school: async (schoolId: string) => {
    await cache.delPattern(`*:school:${schoolId}*`);
    await cache.delPattern(`stats:school:${schoolId}*`);
  },
  
  search: async () => {
    await cache.delPattern('bookads:search:*');
  }
};
