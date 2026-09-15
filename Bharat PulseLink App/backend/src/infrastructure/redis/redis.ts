/**
 * Redis Infrastructure
 *
 * ioredis client abstraction with:
 * - Connection management + ping
 * - Type-safe key/value operations
 * - Expiry support
 * - Graceful shutdown
 * - Optional in development (REDIS_REQUIRED controls staging/production)
 *
 * Future modules will use this for:
 * - Session cache (Prompt 92)
 * - Rate limiting keys (Prompt 119)
 * - QR session locks (Prompt 107)
 * - BullMQ job queues (Prompt 114)
 * - Idempotency keys (Prompt 51)
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import { Redis, type RedisOptions } from 'ioredis';
import { type Logger } from '../logger/logger.js';

// ---------------------------------------------------------------------------
// Redis client interface (allows mocking in tests)
// ---------------------------------------------------------------------------

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<void>;
  incr(key: string): Promise<number>;
  ping(): Promise<boolean>;
  quit(): Promise<void>;
}

// ---------------------------------------------------------------------------
// ioredis adapter
// ---------------------------------------------------------------------------

export class RedisCacheClient implements CacheClient {
  private _client: Redis;
  private _isConnected = false;
  private readonly _logger: Logger;

  constructor(url: string, logger: Logger) {
    this._logger = logger.child({ module: 'redis' });

    const options: RedisOptions = {
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          this._logger.warn('Redis reconnection attempts exceeded', { attempt: times });
          return null; // Stop retrying
        }
        return Math.min(times * 500, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    };

    this._client = new Redis(url, options);

    this._client.on('connect', () => {
      this._isConnected = true;
      this._logger.info('Redis connected');
    });

    this._client.on('error', (err: Error) => {
      this._isConnected = false;
      this._logger.error('Redis error', { error: err.message });
    });

    this._client.on('close', () => {
      this._isConnected = false;
      this._logger.warn('Redis connection closed');
    });
  }

  async connect(): Promise<void> {
    await this._client.connect();
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this._client.ping();
      this._isConnected = result === 'PONG';
      return this._isConnected;
    } catch {
      this._isConnected = false;
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    return this._client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this._client.setex(key, ttlSeconds, value);
    } else {
      await this._client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this._client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this._client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this._client.expire(key, seconds);
  }

  async incr(key: string): Promise<number> {
    return this._client.incr(key);
  }

  async quit(): Promise<void> {
    this._logger.info('Disconnecting Redis');
    await this._client.quit();
    this._logger.info('Redis disconnected');
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  /** Expose the underlying client for BullMQ queue creation */
  get rawClient(): Redis {
    return this._client;
  }
}


// ---------------------------------------------------------------------------
// Null cache client (for environments where Redis is unavailable)
// ---------------------------------------------------------------------------

export class NullCacheClient implements CacheClient {
  private readonly _store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this._store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this._store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this._store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (parseInt(current ?? '0', 10) || 0) + 1;
    await this.set(key, String(next));
    return next;
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async quit(): Promise<void> {
    this._store.clear();
  }
}
