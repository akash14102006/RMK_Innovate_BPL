/**
 * Fastify Application Factory
 *
 * Creates and configures the Fastify instance with:
 * - Security headers (helmet)
 * - CORS with environment-appropriate allowlists
 * - OpenAPI / Swagger 3.1 documentation at /docs
 * - Request ID correlation (UUIDv7)
 * - Request body size limits
 * - JSON schema validation
 * - Central error handler (no stack traces in production)
 * - Health / readiness routes
 * - API versioned route registration
 * - 404 / method-not-allowed handling
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { uuidv7 } from 'uuidv7';
import { type AppDependencies, type RequestContext } from './container.js';
import { type Env } from '../config/env.js';
import { isAppError, AppError, ErrorCode } from '../core/errors/AppError.js';
import { registerHealthRoutes } from './routes/health.routes.js';
import { registerV1Routes } from './routes/v1/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}

export async function createApp(env: Env, deps: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    trustProxy: env.NODE_ENV === 'production',
    bodyLimit: env.REQUEST_BODY_LIMIT_BYTES,
    disableRequestLogging: true,
    genReqId: () => uuidv7(),
  });

  // ── Security headers ─────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts:
      env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
  });

  // ── CORS ─────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = env.CORS_ORIGINS.includes(origin);
      if (!allowed && env.NODE_ENV === 'production') {
        const err = new AppError({
          code: ErrorCode.FORBIDDEN,
          message: 'CORS: origin not allowed',
        });
        return callback(err, false);
      }
      return callback(null, allowed || env.NODE_ENV !== 'production');
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Idempotency-Key'],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  });

  // ── OpenAPI / Swagger 3.1 Documentation ──────────────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Bharat PulseLink — Production API',
        description: "India's Shared Memory for Every Patient, Every Hospital",
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: env.NODE_ENV,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // ── Request context hook ─────────────────────────────────────────────────
  app.addHook('onRequest', async (request: FastifyRequest) => {
    const incomingId = request.headers['x-request-id'];
    const requestId =
      typeof incomingId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingId)
        ? incomingId
        : (request.id as string);

    request.ctx = { requestId };

    deps.logger.debug('Request received', {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
    });
  });

  // ── Response hook ────────────────────────────────────────────────────────
  app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    void reply.header('X-Request-Id', request.ctx?.requestId ?? request.id);
    if (!reply.getHeader('cache-control')) {
      void reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
  });

  // ── Request logging hook ─────────────────────────────────────────────────
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const durationMs = Math.round(reply.elapsedTime);
    deps.logger.info('Request completed', {
      requestId: request.ctx?.requestId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs,
    });
  });

  // ── Central error handler ─────────────────────────────────────────────────
  app.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.ctx?.requestId ?? String(request.id);

    if (isAppError(error)) {
      deps.logger.warn('Application error', {
        requestId,
        code: error.code,
        statusCode: error.statusCode,
        message: error.message,
      });
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.detail && { detail: error.detail }),
          ...(error.issues && { issues: error.issues }),
        },
        requestId,
      });
    }

    deps.logger.error('Unhandled error', {
      requestId,
      error: error instanceof Error ? error.message : 'unknown',
      ...(env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {}),
    });

    return reply.status(500).send({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
      requestId,
    });
  });

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.ctx?.requestId ?? String(request.id);
    return reply.status(404).send({
      error: { code: ErrorCode.NOT_FOUND, message: 'Resource not found' },
      requestId,
    });
  });

  // ── Health / readiness routes ─────────────────────────────────────────────
  await registerHealthRoutes(app, deps);

  // ── Versioned API routes ──────────────────────────────────────────────────
  await registerV1Routes(app, env, deps);

  return app;
}
