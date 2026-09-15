/**
 * Job Queue Infrastructure (BullMQ abstraction)
 *
 * Provider-neutral abstraction over BullMQ for background jobs.
 * Business modules register typed job handlers; the infrastructure
 * layer manages connection, retries, backoff, and dead-letter.
 *
 * Future workers:
 * - Hospital data ingestion (Prompt 95–97)
 * - Notification delivery (Prompt 114)
 * - Blockchain anchoring (Prompt 113)
 * - Sync conflict resolution (Prompt 116)
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import { Queue, Worker, type Job, type JobsOptions, type WorkerOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import { type Logger } from '../logger/logger.js';

// ---------------------------------------------------------------------------
// Job definition types
// ---------------------------------------------------------------------------

export interface JobDefinition<TData = unknown> {
  name: string;
  data: TData;
  options?: JobsOptions;
}

export interface JobHandler<TData = unknown, TResult = void> {
  handle(job: Job<TData>): Promise<TResult>;
}

// ---------------------------------------------------------------------------
// Queue registry
// ---------------------------------------------------------------------------

export interface QueueConfig {
  name: string;
  defaultRetries?: number;
  defaultBackoffMs?: number;
}

export class JobQueueRegistry {
  private readonly _queues = new Map<string, Queue>();
  private readonly _workers = new Map<string, Worker>();
  private readonly _logger: Logger;

  constructor(
    private readonly _redisClient: Redis,
    logger: Logger,
  ) {
    this._logger = logger.child({ module: 'jobs' });
  }

  /**
   * Register a named queue. Creates a BullMQ Queue instance.
   */
  registerQueue(config: QueueConfig): Queue {
    if (this._queues.has(config.name)) {
      return this._queues.get(config.name)!;
    }

    const queue = new Queue(config.name, {
      connection: this._redisClient,
      defaultJobOptions: {
        attempts: config.defaultRetries ?? 3,
        backoff: {
          type: 'exponential',
          delay: config.defaultBackoffMs ?? 1000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    this._queues.set(config.name, queue);
    this._logger.info('Job queue registered', { queue: config.name });
    return queue;
  }

  /**
   * Register a worker to process jobs from a named queue.
   * Each worker handles one job concurrency by default (safe for healthcare data).
   */
  registerWorker<TData, TResult>(
    queueName: string,
    handler: JobHandler<TData, TResult>,
    options?: Partial<WorkerOptions>,
  ): Worker {
    const worker = new Worker<TData, TResult>(
      queueName,
      async (job) => {
        this._logger.debug('Processing job', { queue: queueName, jobId: job.id, attempt: job.attemptsMade });
        return handler.handle(job);
      },
      {
        connection: this._redisClient,
        concurrency: 1, // Conservative default — domain modules can override
        ...options,
      },
    );

    worker.on('failed', (job, err) => {
      this._logger.error('Job failed', {
        queue: queueName,
        jobId: job?.id,
        attempt: job?.attemptsMade,
        error: err.message,
      });
    });

    worker.on('error', (err) => {
      this._logger.error('Worker error', { queue: queueName, error: err.message });
    });

    this._workers.set(queueName, worker);
    this._logger.info('Job worker registered', { queue: queueName });
    return worker;
  }

  /**
   * Graceful shutdown — close all queues and workers.
   */
  async shutdown(): Promise<void> {
    this._logger.info('Shutting down job workers');
    await Promise.all([...this._workers.values()].map((w) => w.close()));
    await Promise.all([...this._queues.values()].map((q) => q.close()));
    this._logger.info('Job queues and workers closed');
  }
}
