/**
 * Patient Profile Routes (Fastify)
 *
 * Exposes patient-centric authenticated endpoints for profile onboarding,
 * section management, optimistic versioning, completion calculation, and review.
 *
 * Owned by: Patient Domain (Prompt 90)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { type ZodSchema } from 'zod';
import type { AppDependencies } from '../../app/container.js';
import { createAuthMiddleware } from '../../app/middleware/auth.middleware.js';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import {
  CreateProfileSchema,
  UpdateProfileSchema,
  UpdateBasicInfoSchema,
  UpdateContactInfoSchema,
  UpdateMedicalBasicsSchema,
  UpdateLifestyleSchema,
  UpdateConditionsSchema,
  UpdateAllergiesSchema,
  UpdateSurgeriesSchema,
  CompleteProfileSchema,
} from './patient.schemas.js';

function validatePayload<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      issues: result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }
  return result.data;
}

export async function registerPatientRoutes(app: FastifyInstance, deps: AppDependencies): Promise<void> {
  const requireAuth = createAuthMiddleware(deps);
  const patientService = deps.patientService;

  const tags = ['Patient Profile'];
  const security = [{ bearerAuth: [] }];

  // ── GET /me/profile ──────────────────────────────────────────────────────
  app.get(
    '/me/profile',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Get current authenticated patient profile',
        description: 'Retrieves canonical patient profile, section data, and completion status.',
        security,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const profile = await patientService.getProfileByUserId(userId);
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── POST /me/profile ─────────────────────────────────────────────────────
  app.post(
    '/me/profile',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Initialize or retrieve patient profile',
        description: 'Atomically creates or retrieves canonical patient profile for the user.',
        security,
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(CreateProfileSchema.partial(), request.body ?? {});
      const profile = await patientService.getOrCreateProfile(userId, payload);
      return reply.status(201).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile ────────────────────────────────────────────────────
  app.patch(
    '/me/profile',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update patient profile (optimistic locking)',
        description: 'Updates profile fields with version validation (409 conflict handling).',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateProfileSchema, request.body ?? {});
      const profile = await patientService.updateProfile(userId, payload);
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile/basic ──────────────────────────────────────────────
  app.patch(
    '/me/profile/basic',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update basic demographic info',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateBasicInfoSchema, request.body ?? {});
      const profile = await patientService.updateProfile(userId, payload);
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile/contact ────────────────────────────────────────────
  app.patch(
    '/me/profile/contact',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update contact and address information',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateContactInfoSchema, request.body ?? {});
      const profile = await patientService.updateProfile(userId, {
        primaryPhone: payload.primaryPhone,
        primaryEmail: payload.primaryEmail,
        addressLine1: payload.addressLine1,
        addressLine2: payload.addressLine2,
        locality: payload.locality,
        cityId: payload.cityId,
        districtId: payload.districtId,
        stateId: payload.stateId,
        pincode: payload.pincode,
        expectedVersion: payload.expectedVersion,
      });
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile/medical-basics ─────────────────────────────────────
  app.patch(
    '/me/profile/medical-basics',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update medical basics (blood group, height, weight, ABHA)',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateMedicalBasicsSchema, request.body ?? {});
      const profile = await patientService.updateProfile(userId, {
        bloodGroup: payload.bloodGroup,
        heightCm: payload.heightCm,
        weightKg: payload.weightKg,
        abhaId: payload.abhaId,
        expectedVersion: payload.expectedVersion,
      });
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile/lifestyle ──────────────────────────────────────────
  app.patch(
    '/me/profile/lifestyle',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update lifestyle preferences (smoking, alcohol, activity, sleep)',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateLifestyleSchema, request.body ?? {});
      const profile = await patientService.updateProfile(userId, {
        smokingStatus: payload.smokingStatus,
        alcoholStatus: payload.alcoholStatus,
        activityLevel: payload.activityLevel,
        sleepPattern: payload.sleepPattern,
        expectedVersion: payload.expectedVersion,
      });
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile/conditions ─────────────────────────────────────────
  app.patch(
    '/me/profile/conditions',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update patient-reported health conditions',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateConditionsSchema, request.body ?? {});
      const profile = await patientService.updateConditions(
        userId,
        payload.conditions,
        payload.expectedVersion,
      );
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile/allergies ──────────────────────────────────────────
  app.patch(
    '/me/profile/allergies',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update patient-reported allergies',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateAllergiesSchema, request.body ?? {});
      const profile = await patientService.updateAllergies(
        userId,
        payload.allergies,
        payload.expectedVersion,
      );
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── PATCH /me/profile/surgeries ──────────────────────────────────────────
  app.patch(
    '/me/profile/surgeries',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Update patient-reported surgical history',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(UpdateSurgeriesSchema, request.body ?? {});
      const profile = await patientService.updateSurgeries(
        userId,
        payload.surgeries,
        payload.expectedVersion,
      );
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── GET /me/profile/completion ───────────────────────────────────────────
  app.get(
    '/me/profile/completion',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Calculate profile completion breakdown and missing requirements',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const completion = await patientService.getCompletionStatus(userId);
      return reply.status(200).send({ success: true, data: completion });
    },
  );

  // ── POST /me/profile/complete ────────────────────────────────────────────
  app.post(
    '/me/profile/complete',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Complete patient profile onboarding (server-gated)',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(CompleteProfileSchema, request.body ?? {});
      const profile = await patientService.completeProfile(userId, payload?.expectedVersion);
      return reply.status(200).send({ success: true, data: profile });
    },
  );

  // ── GET /me/profile/summary ──────────────────────────────────────────────
  app.get(
    '/me/profile/summary',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Get lightweight profile summary for dashboard',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const summary = await patientService.getProfileSummary(userId);
      return reply.status(200).send({ success: true, data: summary });
    },
  );

  // ── GET /me/profile/review ───────────────────────────────────────────────
  app.get(
    '/me/profile/review',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Get full profile review read model',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const review = await patientService.getProfileByUserId(userId);
      return reply.status(200).send({ success: true, data: review });
    },
  );
}
