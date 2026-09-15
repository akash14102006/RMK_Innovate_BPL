/**
 * Unit tests — Authentication & Session Endpoints
 *
 * Tests:
 * - POST /api/v1/auth/exchange with valid token creates/returns user + profile
 * - POST /api/v1/auth/exchange fails fast on invalid/empty token
 * - POST /api/v1/auth/logout revokes session
 * - POST /api/v1/auth/revoke-all revokes all user sessions
 * - GET /api/v1/auth/me returns authenticated principal and profile
 * - Protected endpoints reject unauthenticated requests with 401
 */

import { describe, it, expect } from 'vitest';
import { createTestApp } from '../../helpers/createTestApp.js';
import type { UserRow, UserAuthIdentityRow, PatientProfileRow } from '../../../src/core/types/database.types.js';

describe('Authentication & Session Endpoints', () => {
  it('POST /api/v1/auth/exchange returns user and patient profile for valid token', async () => {
    const mockUser: UserRow = {
      id: 'usr_test_123',
      status: 'ACTIVE',
      last_authenticated_at: new Date(),
      last_seen_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockIdentity: UserAuthIdentityRow = {
      id: 'ident_test_123',
      user_id: 'usr_test_123',
      provider: 'DESCOPE',
      provider_subject: 'descope_patient_123',
      email: 'test_patient_123@bharatpulselink.in',
      email_verified_at: new Date(),
      phone: null,
      phone_verified_at: null,
      provider_created_at: null,
      last_authenticated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockProfile: PatientProfileRow = {
      id: 'pat_test_123',
      user_id: 'usr_test_123',
      version: 1,
      full_name: 'Rahul Sharma',
      preferred_name: null,
      gender: 'MALE',
      date_of_birth: new Date('1990-05-15'),
      status: 'ACTIVE',
      abha_id: '12-3456-7890-1234',
      blood_group: 'O+',
      marital_status: 'MARRIED',
      occupation: 'Software Engineer',
      primary_phone: '+919876543210',
      primary_email: 'test_patient_123@bharatpulselink.in',
      address_line_1: 'Indiranagar',
      address_line_2: null,
      locality: 'Indiranagar',
      city_id: null,
      district_id: null,
      state_id: null,
      pincode: '560038',
      height_cm: null,
      weight_kg: null,
      smoking_status: null,
      alcohol_status: null,
      activity_level: null,
      sleep_pattern: null,
      completed_at: null,
      last_synced_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const app = await createTestApp({
      depsOverrides: {
        identityResolver: {
          resolveOrCreateUser: async () => ({
            user: { id: mockUser.id, status: mockUser.status },
            identity: mockIdentity,
            isNewUser: false,
          }),
        } as any,
        userRepo: {
          findById: async () => mockUser,
          updateLastAuthenticated: async () => {},
          registerDevice: async () => ({} as any),
        } as any,
        patientRepo: {
          findByUserId: async () => mockProfile,
        } as any,
        sessionService: {
          createSession: async () => ({
            session: { sessionId: 'sess_123', current: true, status: 'ACTIVE' } as any,
            sessionToken: 'test_token_patient_123',
            expiresAt: new Date(),
          }),
        } as any,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/exchange',
      payload: {
        sessionToken: 'test_token_patient_123',
        deviceFingerprint: 'fp_device_abc',
        platform: 'android',
        appVersion: '1.0.0',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.id).toBe('usr_test_123');
    expect(body.user.status).toBe('ACTIVE');
    expect(body.profile.fullName).toBe('Rahul Sharma');
    expect(body.profile.isComplete).toBe(true);

    await app.close();
  });

  it('POST /api/v1/auth/exchange fails with 400 on missing payload fields', async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/exchange',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');

    await app.close();
  });

  it('GET /api/v1/auth/me returns authenticated user with valid Bearer token', async () => {
    const mockUser: UserRow = {
      id: 'usr_test_456',
      status: 'ACTIVE',
      last_authenticated_at: new Date(),
      last_seen_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockIdentity: UserAuthIdentityRow = {
      id: 'ident_test_456',
      user_id: 'usr_test_456',
      provider: 'DESCOPE',
      provider_subject: 'descope_patient_456',
      email: 'test_patient_456@bharatpulselink.in',
      email_verified_at: new Date(),
      phone: null,
      phone_verified_at: null,
      provider_created_at: null,
      last_authenticated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockProfile: PatientProfileRow = {
      id: 'pat_test_456',
      user_id: 'usr_test_456',
      version: 1,
      full_name: 'Priya Patel',
      preferred_name: null,
      gender: 'FEMALE',
      date_of_birth: new Date('1994-08-20'),
      status: 'ACTIVE',
      abha_id: '98-7654-3210-9876',
      blood_group: 'B+',
      marital_status: null,
      occupation: null,
      primary_phone: null,
      primary_email: null,
      address_line_1: null,
      address_line_2: null,
      locality: null,
      city_id: null,
      district_id: null,
      state_id: null,
      pincode: '400001',
      height_cm: null,
      weight_kg: null,
      smoking_status: null,
      alcohol_status: null,
      activity_level: null,
      sleep_pattern: null,
      completed_at: null,
      last_synced_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const app = await createTestApp({
      depsOverrides: {
        identityRepo: {
          findByProviderSubject: async () => mockIdentity,
        } as any,
        userRepo: {
          findById: async () => mockUser,
        } as any,
        patientRepo: {
          findByUserId: async () => mockProfile,
        } as any,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: 'Bearer test_token_patient_456',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.id).toBe('usr_test_456');
    expect(body.profile.fullName).toBe('Priya Patel');

    await app.close();
  });

  it('POST /api/v1/auth/logout revokes sessions and returns success', async () => {
    let revokedUserId = '';
    const mockUser: UserRow = {
      id: 'usr_test_logout',
      status: 'ACTIVE',
      last_authenticated_at: new Date(),
      last_seen_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockIdentity: UserAuthIdentityRow = {
      id: 'ident_test_logout',
      user_id: 'usr_test_logout',
      provider: 'DESCOPE',
      provider_subject: 'descope_patient_logout',
      email: null,
      email_verified_at: null,
      phone: null,
      phone_verified_at: null,
      provider_created_at: null,
      last_authenticated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const app = await createTestApp({
      depsOverrides: {
        identityRepo: {
          findByProviderSubject: async () => mockIdentity,
        } as any,
        userRepo: {
          findById: async () => mockUser,
        } as any,
        sessionService: {
          revokeSession: async (_userId: string, _sessionId: string) => {
            revokedUserId = _userId;
            return {} as any;
          },
          revokeAllSessions: async (userId: string) => {
            revokedUserId = userId;
            return { revokedCount: 1 };
          },
        } as any,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: {
        authorization: 'Bearer test_token_patient_logout',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(revokedUserId).toBe('usr_test_logout');

    await app.close();
  });

  it('POST /api/v1/auth/revoke-all revokes all sessions', async () => {
    const mockUser: UserRow = {
      id: 'usr_test_revoke_all',
      status: 'ACTIVE',
      last_authenticated_at: new Date(),
      last_seen_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockIdentity: UserAuthIdentityRow = {
      id: 'ident_test_revoke_all',
      user_id: 'usr_test_revoke_all',
      provider: 'DESCOPE',
      provider_subject: 'descope_patient_revoke_all',
      email: null,
      email_verified_at: null,
      phone: null,
      phone_verified_at: null,
      provider_created_at: null,
      last_authenticated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const app = await createTestApp({
      depsOverrides: {
        identityRepo: {
          findByProviderSubject: async () => mockIdentity,
        } as any,
        userRepo: {
          findById: async () => mockUser,
        } as any,
        sessionService: {
          revokeAllSessions: async () => ({ revokedCount: 3 }),
        } as any,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/revoke-all',
      headers: {
        authorization: 'Bearer test_token_patient_revoke_all',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.revokedSessionsCount).toBe(3);

    await app.close();
  });

  it('POST /api/v1/auth/exchange creates new user and incomplete profile shell for new signups', async () => {
    let resolvedUser = false;
    let createdProfile = false;

    const mockUser: UserRow = {
      id: 'usr_new_999',
      status: 'ACTIVE',
      last_authenticated_at: new Date(),
      last_seen_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockIdentity: UserAuthIdentityRow = {
      id: 'ident_new_999',
      user_id: 'usr_new_999',
      provider: 'DESCOPE',
      provider_subject: 'descope_new_signup',
      email: 'test_new_signup@bharatpulselink.in',
      email_verified_at: new Date(),
      phone: null,
      phone_verified_at: null,
      provider_created_at: null,
      last_authenticated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockProfile: PatientProfileRow = {
      id: 'pat_new_999',
      user_id: 'usr_new_999',
      version: 1,
      full_name: 'Patient',
      preferred_name: null,
      gender: 'UNDISCLOSED',
      date_of_birth: new Date('2000-01-01'),
      status: 'INCOMPLETE',
      abha_id: null,
      blood_group: null,
      marital_status: null,
      occupation: null,
      primary_phone: null,
      primary_email: null,
      address_line_1: null,
      address_line_2: null,
      locality: null,
      city_id: null,
      district_id: null,
      state_id: null,
      pincode: null,
      height_cm: null,
      weight_kg: null,
      smoking_status: null,
      alcohol_status: null,
      activity_level: null,
      sleep_pattern: null,
      completed_at: null,
      last_synced_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const app = await createTestApp({
      depsOverrides: {
        identityResolver: {
          resolveOrCreateUser: async () => {
            resolvedUser = true;
            return {
              user: { id: mockUser.id, status: mockUser.status },
              identity: mockIdentity,
              isNewUser: true,
            };
          },
        } as any,
        userRepo: {
          findById: async () => mockUser,
          updateLastAuthenticated: async () => {},
        } as any,
        patientRepo: {
          findByUserId: async () => null,
          createProfile: async () => {
            createdProfile = true;
            return mockProfile;
          },
        } as any,
        sessionService: {
          createSession: async () => ({
            session: { sessionId: 'sess_new_999', current: true, status: 'ACTIVE' } as any,
            sessionToken: 'test_token_new_signup',
            expiresAt: new Date(),
          }),
        } as any,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/exchange',
      payload: {
        sessionToken: 'test_token_new_signup',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(resolvedUser).toBe(true);
    expect(createdProfile).toBe(true);
    expect(body.isNewUser).toBe(true);
    expect(body.profile.isComplete).toBe(false);

    await app.close();
  });

  it('rejects suspended accounts with 403 Forbidden', async () => {
    const mockSuspendedUser: UserRow = {
      id: 'usr_suspended',
      status: 'SUSPENDED',
      last_authenticated_at: new Date(),
      last_seen_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockIdentity: UserAuthIdentityRow = {
      id: 'ident_suspended',
      user_id: 'usr_suspended',
      provider: 'DESCOPE',
      provider_subject: 'descope_suspended',
      email: null,
      email_verified_at: null,
      phone: null,
      phone_verified_at: null,
      provider_created_at: null,
      last_authenticated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const app = await createTestApp({
      depsOverrides: {
        identityRepo: {
          findByProviderSubject: async () => mockIdentity,
        } as any,
        userRepo: {
          findById: async () => mockSuspendedUser,
        } as any,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: 'Bearer test_token_suspended',
      },
    });

    expect(response.statusCode).toBe(403);
    const body = response.json();
    expect(body.error.code).toBe('FORBIDDEN');

    await app.close();
  });
});
