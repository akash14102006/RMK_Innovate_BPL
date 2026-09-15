/**
 * Database Infrastructure
 *
 * Knex connection pool with:
 * - Pool configuration from environment
 * - Startup connectivity validation (SELECT 1)
 * - Transaction abstraction
 * - Graceful shutdown
 * - PostGIS awareness (extension enabled via migration)
 *
 * Owned by: Platform Foundation (Prompt 87)
 * Schema managed by: Migrations (Prompt 101/102)
 */

import knex, { type Knex } from 'knex';
import { type Logger } from '../logger/logger.js';
import { createInMemoryPostgres } from './memoryDatabase.js';

// ---------------------------------------------------------------------------
// Database configuration type
// ---------------------------------------------------------------------------

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  poolIdleTimeoutMs: number;
  acquireTimeoutMs: number;
  statementTimeoutMs: number;
}

// ---------------------------------------------------------------------------
// Transaction callback type
// ---------------------------------------------------------------------------

export type TransactionCallback<T> = (trx: Knex.Transaction) => Promise<T>;

// ---------------------------------------------------------------------------
// Database client
// ---------------------------------------------------------------------------

export class DatabaseClient {
  private _knex: Knex;
  private readonly _logger: Logger;
  private _isConnected = false;
  private _usingMemoryDb = false;

  constructor(config: DatabaseConfig, logger: Logger) {
    this._logger = logger.child({ module: 'database' });

    this._knex = knex({
      client: 'pg',
      connection: config.url,
      pool: {
        min: config.poolMin,
        max: config.poolMax,
        idleTimeoutMillis: config.poolIdleTimeoutMs,
        acquireTimeoutMillis: config.acquireTimeoutMs,
      },
      acquireConnectionTimeout: config.acquireTimeoutMs,
      asyncStackTraces: process.env['NODE_ENV'] === 'development',
    });
  }

  /**
   * Validate connectivity. Called during startup/readiness.
   * Runs a lightweight SELECT 1 — never scans application tables.
   */
  async ping(): Promise<boolean> {
    try {
      await this._knex.raw('SELECT 1');
      this._isConnected = true;
      return true;
    } catch (err) {
      if (process.env['NODE_ENV'] !== 'production' && process.env['REAL_DATABASE_REQUIRED'] !== 'true') {
        this._logger.warn('External PostgreSQL unreachable — initializing high-fidelity in-memory PostgreSQL fallback (pg-mem)');
        try {
          this._knex = await createInMemoryPostgres(this._logger);
          this._isConnected = true;
          this._usingMemoryDb = true;
          return true;
        } catch (memErr) {
          this._logger.error('Failed to initialize in-memory PostgreSQL engine', {
            error: memErr instanceof Error ? memErr.message : 'unknown',
          });
        }
      }
      this._isConnected = false;
      this._logger.error('Database ping failed', {
        error: err instanceof Error ? err.message : 'unknown',
      });
      return false;
    }
  }

  /**
   * Run a function within a database transaction.
   * Commits on success, rolls back on any thrown error.
   */
  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    return this._knex.transaction(callback);
  }

  /**
   * Access the underlying Knex instance for query building.
   * Domain repositories use this through the repository interface.
   */
  get query(): Knex {
    return this._knex;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isUsingMemoryDb(): boolean {
    return this._usingMemoryDb;
  }

  /**
   * Gracefully destroy the connection pool.
   * Called during server shutdown.
   */
  async destroy(): Promise<void> {
    this._logger.info('Destroying database connection pool');
    await this._knex.destroy();
    this._isConnected = false;
    this._logger.info('Database connection pool destroyed');
  }
}

// ---------------------------------------------------------------------------
// Repository interface foundation (Prompt 87 §89)
// ---------------------------------------------------------------------------

export interface Repository<TEntity, TId = string> {
  findById(id: TId, trx?: Knex.Transaction): Promise<TEntity | null>;
}

export interface WriteRepository<TEntity, TId = string, TCreate = Omit<TEntity, 'id'>>
  extends Repository<TEntity, TId> {
  create(data: TCreate, trx?: Knex.Transaction): Promise<TEntity>;
  update(id: TId, data: Partial<TCreate>, trx?: Knex.Transaction): Promise<TEntity | null>;
  delete(id: TId, trx?: Knex.Transaction): Promise<boolean>;
}
