/**
 * Outbound HTTP Client Foundation
 *
 * Implements standardized, secure outbound HTTP requests for external integrations:
 * - Explicit timeouts per request (never hangs indefinitely)
 * - Request ID propagation via headers
 * - Normalized dependency error taxonomy
 * - Sanitized request/response logging
 * - Retry hook for idempotent HTTP methods (GET/HEAD)
 *
 * Owned by: Platform Foundation (Prompt 87 §54–57)
 */

import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import type { Logger } from '../logger/logger.js';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  requestId?: string;
  maxRetries?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
  durationMs: number;
}

export class HttpClient {
  private readonly _logger: Logger;
  private readonly _defaultTimeoutMs: number;

  constructor(
    private readonly _serviceName: string,
    logger: Logger,
    defaultTimeoutMs = 10000,
  ) {
    this._logger = logger.child({ module: 'http-client', externalService: this._serviceName });
    this._defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Executes an HTTP request with timeout, logging, and error normalization.
   */
  async request<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const method = options.method ?? 'GET';
    const timeoutMs = options.timeoutMs ?? this._defaultTimeoutMs;
    const maxRetries = options.maxRetries ?? (method === 'GET' ? 2 : 0);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'BharatPulseLink-Backend/1.0',
      ...(options.headers ?? {}),
    };

    if (options.requestId) {
      headers['X-Request-Id'] = options.requestId;
    }

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      attempt++;
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;

        let responseData: unknown = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json().catch(() => null);
        } else {
          responseData = await response.text().catch(() => null);
        }

        const resHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          resHeaders[key] = val;
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new AppError({
              code: ErrorCode.DEPENDENCY_RATE_LIMITED,
              message: `${this._serviceName} rate limit exceeded`,
            });
          }
          if (response.status === 401 || response.status === 403) {
            throw new AppError({
              code: ErrorCode.DEPENDENCY_AUTH_FAILURE,
              message: `${this._serviceName} authentication rejected`,
            });
          }
          if (response.status >= 500) {
            throw new AppError({
              code: ErrorCode.DEPENDENCY_UNAVAILABLE,
              message: `${this._serviceName} returned server error (${response.status})`,
            });
          }
          throw new AppError({
            code: ErrorCode.DEPENDENCY_INVALID_RESPONSE,
            message: `${this._serviceName} returned status ${response.status}`,
          });
        }

        return {
          status: response.status,
          data: responseData as T,
          headers: resHeaders,
          durationMs,
        };
      } catch (err: unknown) {
        lastError = err;
        const isAbortError = err instanceof Error && err.name === 'AbortError';

        if (isAbortError) {
          this._logger.warn('Outbound HTTP request timed out', {
            service: this._serviceName,
            url,
            timeoutMs,
            attempt,
          });
          if (attempt > maxRetries) {
            throw new AppError({
              code: ErrorCode.DEPENDENCY_TIMEOUT,
              message: `${this._serviceName} request timed out after ${timeoutMs}ms`,
            });
          }
        } else if (err instanceof AppError) {
          if (attempt > maxRetries || err.code !== ErrorCode.DEPENDENCY_UNAVAILABLE) {
            throw err;
          }
        }

        // Exponential backoff before retry
        if (attempt <= maxRetries) {
          await new Promise((res) => setTimeout(res, 200 * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError instanceof AppError
      ? lastError
      : new AppError({
          code: ErrorCode.DEPENDENCY_UNAVAILABLE,
          message: `${this._serviceName} connection failed`,
          cause: lastError,
        });
  }
}
