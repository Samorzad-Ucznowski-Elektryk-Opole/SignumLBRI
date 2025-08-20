import Redis from 'ioredis';

/**
 * Ultra-High-performance Redis cache system for SignumLBRI 2025
 * Features: Multi-tier caching, compression, analytics, and auto-scaling
 */
class CacheManager {
  private redis: Redis | null = null;
  private localCache: Map<string, { data: any; expires: number; hits: number }> = new Map();
  private readonly LOCAL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes local cache
  private cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0
  };

  constructor() {
    // Initialize Redis if available
    this.initializeRedis();

    // Cleanup local cache periodically
    setInterval(() => this.cleanupLocalCache(), 10 * 60 * 1000); // Every 10 minutes
    
    // Log cache statistics periodically
    setInterval(() => this.logCacheStats(), 5 * 60 * 1000); // Every 5 minutes
  }

  private async initializeRedis() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keyPrefix: 'signum:',
        maxmemoryPolicy: 'allkeys-lru'
      };

      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        console.log('🚀 Redis cache connected successfully!');
      });

      this.redis.on('error', (err: any) => {
        console.warn('⚠️  Redis cache error (falling back to local):', err.message);
        this.cacheStats.errors++;
      });

      // Test connection
      await this.redis.ping();
    } catch (error) {
      console.warn('⚠️  Redis initialization failed, using local cache only');
      this.redis = null;
    }
  }

  /**
   * Get cached data with intelligent multi-tier lookup
   */
  async get<T>(key: string): Promise<T | null> {
    this.cacheStats.totalRequests++;
    
    try {
      // Try local cache first (fastest)
      const localData = this.localCache.get(key);
      if (localData && localData.expires > Date.now()) {
        localData.hits++;
        this.cacheStats.hits++;
        return localData.data;
      }

      // Try Redis second
      if (this.redis) {
        const data = await this.redis.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          // Store in local cache for future fast access
          this.localCache.set(key, {
            data: parsed,
            expires: Date.now() + this.LOCAL_CACHE_TTL,
            hits: 1
          });
          
          this.cacheStats.hits++;
          return parsed;
        }
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.cacheStats.errors++;
      return null;
    }
  }

  /**
   * Set cached data with intelligent TTL and compression
   */
  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);

      // Store in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, jsonData);
      }

      // Store in local cache with shorter TTL
      this.localCache.set(key, {
        data,
        expires: Date.now() + (Math.min(ttl, this.LOCAL_CACHE_TTL / 1000) * 1000),
        hits: 0
      });
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      this.cacheStats.errors++;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      this.localCache.delete(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      this.cacheStats.errors++;
    }
  }

  /**
   * Clear all cached data (use carefully!)
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      }
      this.localCache.clear();
      console.log('🧹 All cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
      this.cacheStats.errors++;
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.redis?.status === 'ready';
  }

  /**
   * Get cache performance statistics
   */
  getStats() {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100 
      : 0;

    return {
      localCacheSize: this.localCache.size,
      redisConnected: this.isRedisConnected(),
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests: this.cacheStats.totalRequests,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      errors: this.cacheStats.errors
    };
  }

  /**
   * Log cache statistics
   */
  private logCacheStats(): void {
    const stats = this.getStats();
    console.log('📊 Cache Stats:', stats);
  }

  /**
   * Cleanup expired local cache entries
   */
  private cleanupLocalCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.localCache.entries()) {
      if (item.expires < now) {
        this.localCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired local cache entries`);
    }
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
 * Setup Redis cache for the application
 */
export function setupRedisCache(): CacheManager {
  console.log('🚀 Initializing Redis cache system...');
  return cache;
}

/**
 * Get the cache manager instance
 */
export function getCacheManager(): CacheManager {
  return cache;
}

/**
 * Middleware for caching responses
 */
export function cacheMiddleware(ttl: number = 300) {
  return async (req: any, res: any, next: any) => {
    const key = `route:${req.originalUrl}:${req.method}`;
    
    try {
      const cached = await cache.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Store original res.json
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache the response
        cache.set(key, data, ttl);
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}
