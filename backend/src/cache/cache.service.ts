import { Injectable, Logger } from '@nestjs/common';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface SearchCacheKey {
  type: 'address' | 'extrinsic';
  query: string;
  blocksToScan?: number;
  batchSize?: number;
  strategy?: string;
  maxBlocks?: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly pendingRequests = new Map<string, Promise<any>>();
  
  // Default TTL values (in milliseconds)
  private readonly DEFAULT_TTL = {
    ADDRESS_SEARCH: 5 * 60 * 1000, // 5 minutes
    EXTRINSIC_SEARCH: 10 * 60 * 1000, // 10 minutes
    BLOCK_INFO: 2 * 60 * 1000, // 2 minutes
  };

  constructor() {
    // Set up automatic cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Generates a cache key for search requests
   */
  private generateCacheKey(key: SearchCacheKey): string {
    const parts = [
      key.type,
      key.query,
      key.blocksToScan?.toString() || 'default',
      key.batchSize?.toString() || 'default',
      key.strategy || 'default',
      key.maxBlocks?.toString() || 'default'
    ];
    return parts.join('|');
  }

  /**
   * Checks if a cache entry exists and is still valid
   */
  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Gets a value from cache if it exists and is valid
   */
  get<T>(key: SearchCacheKey): T | null {
    const cacheKey = this.generateCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    if (!this.isCacheValid(entry)) {
      this.logger.debug(`Cache entry expired for key: ${cacheKey}`);
      this.cache.delete(cacheKey);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${cacheKey}`);
    return entry.data;
  }

  /**
   * Sets a value in cache with TTL
   */
  set<T>(key: SearchCacheKey, data: T, ttl?: number): void {
    const cacheKey = this.generateCacheKey(key);
    const defaultTtl = key.type === 'address' ? this.DEFAULT_TTL.ADDRESS_SEARCH : this.DEFAULT_TTL.EXTRINSIC_SEARCH;
    
    // Validate data before caching
    if (!data) {
      this.logger.warn(`Attempted to cache null/undefined data for key: ${cacheKey}`);
      return;
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || defaultTtl
    };

    this.cache.set(cacheKey, entry);
    this.logger.debug(`Cached data for key: ${cacheKey} with TTL: ${entry.ttl}ms, data type: ${typeof data}, data keys: ${Array.isArray(data) ? 'array' : Object.keys(data || {}).join(', ')}`);
  }

  /**
   * Checks if there's a pending request for the same key to implement request pooling
   */
  hasPendingRequest(key: SearchCacheKey): boolean {
    const cacheKey = this.generateCacheKey(key);
    return this.pendingRequests.has(cacheKey);
  }

  /**
   * Gets a pending request if it exists
   */
  getPendingRequest<T>(key: SearchCacheKey): Promise<T> | null {
    const cacheKey = this.generateCacheKey(key);
    return this.pendingRequests.get(cacheKey) || null;
  }

  /**
   * Sets a pending request to implement request pooling
   */
  setPendingRequest<T>(key: SearchCacheKey, request: Promise<T>): void {
    const cacheKey = this.generateCacheKey(key);
    this.pendingRequests.set(cacheKey, request);
    
    // Clean up the pending request when it completes
    request.finally(() => {
      this.pendingRequests.delete(cacheKey);
    });
  }

  /**
   * Clears expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Clears all cache and pending requests (useful for debugging)
   */
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.logger.log('All cache and pending requests cleared');
  }

  /**
   * Clears cache entries for a specific type
   */
  clearByType(type: 'address' | 'extrinsic'): void {
    let clearedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(type + '|')) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    this.logger.log(`Cleared ${clearedCount} cache entries for type: ${type}`);
  }

  /**
   * Clears cache entries for a specific query
   */
  clearByQuery(query: string): void {
    let clearedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(query)) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    this.logger.log(`Cleared ${clearedCount} cache entries for query: ${query}`);
  }

  /**
   * Gets cache statistics for debugging
   */
  getStats(): { cacheSize: number; pendingRequestsSize: number } {
    return {
      cacheSize: this.cache.size,
      pendingRequestsSize: this.pendingRequests.size
    };
  }

}
