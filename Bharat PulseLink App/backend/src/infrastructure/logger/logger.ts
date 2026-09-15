/**
 * Structured Logger
 *
 * Pino-based structured logger with:
 * - Sensitive field redaction (credentials, PHI)
 * - Request correlation via requestId
 * - JSON in production, pretty-print in development
 * - Child loggers for modules/contexts
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';
import { PINO_REDACT_PATHS } from '../../core/utils/redaction.js';

// ---------------------------------------------------------------------------
// Logger interface (allows injection / mocking in tests)
// ---------------------------------------------------------------------------

export interface Logger {
  fatal(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;
  trace(msg: string, data?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

// ---------------------------------------------------------------------------
// Pino logger adapter
// ---------------------------------------------------------------------------

class PinoLoggerAdapter implements Logger {
  constructor(private readonly _pino: PinoLogger) {}

  fatal(msg: string, data?: Record<string, unknown>): void {
    this._pino.fatal(data ?? {}, msg);
  }
  error(msg: string, data?: Record<string, unknown>): void {
    this._pino.error(data ?? {}, msg);
  }
  warn(msg: string, data?: Record<string, unknown>): void {
    this._pino.warn(data ?? {}, msg);
  }
  info(msg: string, data?: Record<string, unknown>): void {
    this._pino.info(data ?? {}, msg);
  }
  debug(msg: string, data?: Record<string, unknown>): void {
    this._pino.debug(data ?? {}, msg);
  }
  trace(msg: string, data?: Record<string, unknown>): void {
    this._pino.trace(data ?? {}, msg);
  }
  child(context: Record<string, unknown>): Logger {
    return new PinoLoggerAdapter(this._pino.child(context));
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLogger(options: {
  level: string;
  service: string;
  environment: string;
  pretty?: boolean;
}): Logger {
  const pinoOptions: LoggerOptions = {
    level: options.level,
    name: options.service,
    redact: {
      paths: PINO_REDACT_PATHS,
      censor: '[REDACTED]',
    },
    base: {
      service: options.service,
      environment: options.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  const pinoInstance =
    options.pretty !== false && options.environment === 'development'
      ? pino({ ...pinoOptions, transport: { target: 'pino-pretty', options: { colorize: true } } })
      : pino(pinoOptions);

  return new PinoLoggerAdapter(pinoInstance);
}

// ---------------------------------------------------------------------------
// No-op logger for tests (suppresses output)
// ---------------------------------------------------------------------------

export class NoopLogger implements Logger {
  fatal(_msg: string, _data?: Record<string, unknown>): void {}
  error(_msg: string, _data?: Record<string, unknown>): void {}
  warn(_msg: string, _data?: Record<string, unknown>): void {}
  info(_msg: string, _data?: Record<string, unknown>): void {}
  debug(_msg: string, _data?: Record<string, unknown>): void {}
  trace(_msg: string, _data?: Record<string, unknown>): void {}
  child(_context: Record<string, unknown>): Logger {
    return this;
  }
}
