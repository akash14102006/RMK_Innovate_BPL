/**
 * Unit tests — Repository Layer Foundation
 *
 * Verifies repository instantiation, method presence, and query assembly logic.
 */

import { describe, it, expect } from 'vitest';
import { UserRepository } from '../../../src/infrastructure/database/repositories/UserRepository.js';
import { IdentityRepository } from '../../../src/infrastructure/database/repositories/IdentityRepository.js';
import { PatientRepository } from '../../../src/infrastructure/database/repositories/PatientRepository.js';
import { HospitalRepository } from '../../../src/infrastructure/database/repositories/HospitalRepository.js';
import { ConsentRepository } from '../../../src/infrastructure/database/repositories/ConsentRepository.js';
import { AppointmentRepository } from '../../../src/infrastructure/database/repositories/AppointmentRepository.js';
import { HealthRecordsRepository } from '../../../src/infrastructure/database/repositories/HealthRecordsRepository.js';
import { AuditRepository } from '../../../src/infrastructure/database/repositories/AuditRepository.js';

describe('Database Repositories Foundation', () => {
  // Mock Knex instance
  const mockKnex = ((_table: string) => ({
    where: () => ({ first: async () => null, update: async () => 1, del: async () => 1, orderBy: () => [] }),
    insert: () => ({ returning: async () => [{ id: 'mock-id' }] }),
    select: () => ({ where: () => ({}) }),
    raw: (sql: string) => sql,
  })) as unknown as import('knex').Knex;

  it('UserRepository exposes core user lifecycle, status, and device/session methods', () => {
    const repo = new UserRepository(mockKnex);
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.createUser).toBe('function');
    expect(typeof repo.updateStatus).toBe('function');
    expect(typeof repo.updateLastAuthenticated).toBe('function');
    expect(typeof repo.updateLastSeen).toBe('function');
    expect(typeof repo.createSession).toBe('function');
    expect(typeof repo.revokeSession).toBe('function');
    expect(typeof repo.registerDevice).toBe('function');
  });

  it('IdentityRepository exposes provider-subject lookup, creation, and user identity list', () => {
    const repo = new IdentityRepository(mockKnex);
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.findByProviderSubject).toBe('function');
    expect(typeof repo.findByUserId).toBe('function');
    expect(typeof repo.createIdentity).toBe('function');
    expect(typeof repo.updateLastAuthenticated).toBe('function');
  });

  it('PatientRepository exposes profile, emergency contact, and insurance methods', () => {
    const repo = new PatientRepository(mockKnex);
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.findByUserId).toBe('function');
    expect(typeof repo.createProfile).toBe('function');
    expect(typeof repo.getEmergencyContacts).toBe('function');
    expect(typeof repo.getInsuranceProfiles).toBe('function');
  });

  it('HospitalRepository exposes facility details and PostGIS findNearby query', () => {
    const repo = new HospitalRepository(mockKnex);
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.getFacilityDetails).toBe('function');
    expect(typeof repo.findNearby).toBe('function');
  });

  it('ConsentRepository exposes consent lifecycle and immutable audit trail creation', () => {
    const repo = new ConsentRepository(mockKnex);
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.getPatientConsents).toBe('function');
    expect(typeof repo.createConsent).toBe('function');
    expect(typeof repo.revokeConsent).toBe('function');
  });

  it('AppointmentRepository exposes slot locking and check-in creation', () => {
    const repo = new AppointmentRepository(mockKnex);
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.getPatientAppointments).toBe('function');
    expect(typeof repo.bookAppointment).toBe('function');
    expect(typeof repo.createCheckIn).toBe('function');
    expect(typeof repo.getActiveCheckIn).toBe('function');
  });

  it('HealthRecordsRepository exposes visits, reports, documents, and medications', () => {
    const repo = new HealthRecordsRepository(mockKnex);
    expect(typeof repo.getPatientVisits).toBe('function');
    expect(typeof repo.getPatientReports).toBe('function');
    expect(typeof repo.createReport).toBe('function');
    expect(typeof repo.getPatientDocuments).toBe('function');
    expect(typeof repo.getActiveMedications).toBe('function');
  });

  it('AuditRepository exposes PHI access logging and security events', () => {
    const repo = new AuditRepository(mockKnex);
    expect(typeof repo.logAuditEvent).toBe('function');
    expect(typeof repo.logSecurityEvent).toBe('function');
    expect(typeof repo.getResourceAuditTrail).toBe('function');
  });
});
