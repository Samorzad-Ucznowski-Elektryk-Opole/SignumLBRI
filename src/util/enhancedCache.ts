/**
 * Enhanced Cache System - Advanced Caching with Multiple Layers
 * Building on existing cache.ts with advanced features
 */

// Import the existing cache system
import { cache as existingCache, CacheManager } from '../cache';

// Enhanced cache configuration
interface CacheConfig {
  defaultTTL: number;
  maxMemoryItems: number;
  enableRedis: boolean;
  enableCompression: boolean;
  enableMetrics: boolean;
  keyPrefix: string;
}

// Cache metrics interface
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalKeys: number;
  memoryUsage: number;
  averageResponseTime: number;
}

// Cache strategies
export enum CacheStrategy {
  WRITE_THROUGH = 'write_through',
  WRITE_BEHIND = 'write_behind', 
  WRITE_AROUND = 'write_around',
  READ_THROUGH = 'read_through',
  REFRESH_AHEAD = 'refresh_ahead'
}

// Cache key patterns for organized caching
export const CacheKeys = {
  // User related
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  userListings: (id: string) => `user:listings:${id}`,
  userStats: (id: string) => `user:stats:${id}`,
  
  // Book related
  book: (id: string) => `book:${id}`,
  bookAd: (id: string) => `book:ad:${id}`,
  bookSearch: (query: string, filters?: string) => `book:search:${query}:${filters || 'none'}`,
  bookPopular: (limit: number) => `book:popular:${limit}`,
  booksByISBN: (isbn: string) => `book:isbn:${isbn}`,
  
  // Listing related
  listing: (id: string) => `listing:${id}`,
  listingsByBook: (bookId: string) => `listings:book:${bookId}`,
  listingsBySchool: (schoolId: string) => `listings:school:${schoolId}`,
  listingsActive: (page: number, filters?: string) => `listings:active:${page}:${filters || 'none'}`,
  listingsFeatured: () => `listings:featured`,
  
  // School related
  school: (id: string) => `school:${id}`,
  schoolUsers: (id: string) => `school:users:${id}`,
  schoolStats: (id: string) => `school:stats:${id}`,
  
  // System wide
  globalStats: () => `stats:global`,
  systemHealth: () => `system:health`,
  
  // Search and filters
  searchSuggestions: (query: string) => `search:suggestions:${query}`,
  filterOptions: (type: string) => `filters:${type}`,
  
  // Session and auth
  session: (id: string) => `session:${id}`,
  authToken: (token: string) => `auth:${token}`,
  
  // Temporary data
  temp: (key: string) => `temp:${key}`,
  lock: (resource: string) => `lock:${resource}`
};

// Enhanced cache implementation
export class EnhancedCache extends CacheManager {
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private compressionThreshold: number = 1024; // Compress data larger than 1KB
  private refreshJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    super(); // Call parent constructor
    
    this.config = {
      defaultTTL: 300, // 5 minutes
      maxMemoryItems: 10000,
      enableRedis: true,
      enableCompression: false, // Disabled until compression library is available
      enableMetrics: true,
      keyPrefix: 'slbri:',
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalKeys: 0,
      memoryUsage: 0,
      averageResponseTime: 0
    };

    this.initializeMetrics();
  }

  // Enhanced get method with metrics and fallback
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const prefixedKey = this.config.keyPrefix + key;
      const result = await super.get<T>(prefixedKey);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics('get', result !== null, responseTime);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Enhanced set method with TTL management and compression
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const prefixedKey = this.config.keyPrefix + key;
      const ttl = ttlSeconds || this.config.defaultTTL;
      
      // TODO: Add compression when available
      // const finalValue = this.config.enableCompression && this.shouldCompress(value) 
      //   ? await this.compress(value) 
      //   : value;
      
      await super.set(prefixedKey, value, ttl);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics('set', true, responseTime);
      
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  // Enhanced delete with metrics
  async delete(key: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const prefixedKey = this.config.keyPrefix + key;
      await super.delete(prefixedKey);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics('delete', true, responseTime);
      
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  // Multi-get operation for batch retrieval
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  // Multi-set operation for batch storage
  async mset<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = items.map(item => this.set(item.key, item.value, item.ttl));
    await Promise.all(promises);
  }

  // Pattern-based deletion
  async deletePattern(pattern: string): Promise<number> {
    // This would need implementation based on available cache backend
    console.log(`Deleting keys matching pattern: ${pattern}`);
    return 0; // Placeholder
  }

  // Cache warming - preload frequently accessed data
  async warmCache(): Promise<void> {
    console.log('Warming cache with frequently accessed data...');
    
    try {
      // Warm popular books
      await this.set(CacheKeys.bookPopular(10), [], 600);
      
      // Warm global stats
      await this.set(CacheKeys.globalStats(), {}, 300);
      
      // Warm search suggestions for common terms
      const commonSearches = ['matematyka', 'polski', 'historia', 'biologia'];
      for (const term of commonSearches) {
        await this.set(CacheKeys.searchSuggestions(term), [], 1800);
      }
      
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  // Distributed locking mechanism
  async lock(resource: string, ttlSeconds: number = 30): Promise<boolean> {
    const lockKey = CacheKeys.lock(resource);
    const lockValue = Date.now().toString();
    
    try {
      const existing = await this.get(lockKey);
      if (existing) {
        return false; // Lock already held
      }
      
      await this.set(lockKey, lockValue, ttlSeconds);
      return true;
    } catch (error) {
      console.error(`Lock acquisition failed for ${resource}:`, error);
      return false;
    }
  }

  // Release distributed lock
  async unlock(resource: string): Promise<void> {
    const lockKey = CacheKeys.lock(resource);
    await this.delete(lockKey);
  }

  // Cache-aside pattern implementation
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlSeconds?: number
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null) {
      value = await fetcher();
      await this.set(key, value, ttlSeconds);
    }
    
    return value;
  }

  // Write-through cache pattern
  async writeThrough<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    ttlSeconds?: number
  ): Promise<void> {
    // Write to both cache and storage
    await Promise.all([
      this.set(key, value, ttlSeconds),
      writer(value)
    ]);
  }

  // Write-behind cache pattern
  async writeBehind<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    ttlSeconds?: number,
    delay: number = 5000
  ): Promise<void> {
    // Write to cache immediately
    await this.set(key, value, ttlSeconds);
    
    // Schedule write to storage
    setTimeout(async () => {
      try {
        await writer(value);
      } catch (error) {
        console.error(`Write-behind failed for key ${key}:`, error);
      }
    }, delay);
  }

  // Refresh-ahead pattern
  async refreshAhead<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    refreshThreshold: number = 0.8
  ): Promise<T> {
    const value = await this.get<T>(key);
    
    if (value !== null) {
      // Check if we should refresh (when 80% of TTL has passed)
      const refreshTime = ttlSeconds * refreshThreshold * 1000;
      
      // Schedule background refresh if not already scheduled
      if (!this.refreshJobs.has(key)) {
        const timeout = setTimeout(async () => {
          try {
            const freshValue = await fetcher();
            await this.set(key, freshValue, ttlSeconds);
            this.refreshJobs.delete(key);
          } catch (error) {
            console.error(`Refresh-ahead failed for key ${key}:`, error);
            this.refreshJobs.delete(key);
          }
        }, refreshTime);
        
        this.refreshJobs.set(key, timeout);
      }
      
      return value;
    }
    
    // Cache miss - fetch and store
    const freshValue = await fetcher();
    await this.set(key, freshValue, ttlSeconds);
    return freshValue;
  }

  // Get cache metrics
  getMetrics(): CacheMetrics & { hitRatio: number; avgResponseTime: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRatio: total > 0 ? this.metrics.hits / total : 0,
      avgResponseTime: this.metrics.averageResponseTime
    };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalKeys: 0,
      memoryUsage: 0,
      averageResponseTime: 0
    };
  }

  // Cache health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: boolean;
    memory: boolean;
    metrics: CacheMetrics;
  }> {
    try {
      // Test basic operations
      const testKey = 'health_check_' + Date.now();
      const testValue = 'test';
      
      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.delete(testKey);
      
      const isWorking = retrieved === testValue;
      const metrics = this.getMetrics();
      
      return {
        status: isWorking ? 'healthy' : 'unhealthy',
        redis: this.config.enableRedis,
        memory: true,
        metrics
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: false,
        memory: false,
        metrics: this.metrics
      };
    }
  }

  // Private helper methods
  private updateMetrics(operation: 'get' | 'set' | 'delete', success: boolean, responseTime: number): void {
    if (!this.config.enableMetrics) return;
    
    if (operation === 'get') {
      if (success) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
    } else if (operation === 'set') {
      this.metrics.sets++;
    } else if (operation === 'delete') {
      this.metrics.deletes++;
    }
    
    // Update average response time (simple moving average)
    const totalOps = this.metrics.hits + this.metrics.misses + this.metrics.sets + this.metrics.deletes;
    this.metrics.averageResponseTime = ((this.metrics.averageResponseTime * (totalOps - 1)) + responseTime) / totalOps;
  }

  private initializeMetrics(): void {
    if (!this.config.enableMetrics) return;
    
    // Reset metrics every hour
    setInterval(() => {
      console.log('Cache Metrics:', this.getMetrics());
      // Don't reset - keep cumulative stats
    }, 3600000); // 1 hour
  }

  private shouldCompress(value: any): boolean {
    const size = JSON.stringify(value).length;
    return size > this.compressionThreshold;
  }

  // TODO: Implement when compression libraries are available
  // private async compress(value: any): Promise<string> {
  //   return JSON.stringify(value); // Placeholder
  // }
  
  // TODO: Implement when compression libraries are available  
  // private async decompress(value: string): Promise<any> {
  //   return JSON.parse(value); // Placeholder
  // }
}

// Create enhanced cache instance
export const enhancedCache = new EnhancedCache({
  defaultTTL: 300,
  maxMemoryItems: 10000,
  enableRedis: true,
  enableCompression: false,
  enableMetrics: true,
  keyPrefix: 'slbri:'
});

// Export for compatibility with existing code
export const cache = enhancedCache;

// Cache initialization
export const initializeCache = async (): Promise<void> => {
  try {
    console.log('Initializing enhanced cache system...');
    
    // Perform health check
    const health = await enhancedCache.healthCheck();
    console.log('Cache health check:', health);
    
    // Warm cache if healthy
    if (health.status === 'healthy') {
      await enhancedCache.warmCache();
    }
    
    console.log('Enhanced cache system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize enhanced cache:', error);
  }
};

export default enhancedCache;
