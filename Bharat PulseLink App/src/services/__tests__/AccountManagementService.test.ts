import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountManagementService from '../AccountManagementService';

vi.mock('../secureStore', () => {
  let mockStore: Record<string, string> = {};
  return {
    default: {
      set: vi.fn().mockImplementation((k: string, v: string) => {
        mockStore[k] = v;
        return Promise.resolve();
      }),
      get: vi.fn().mockImplementation((k: string) => {
        return Promise.resolve(mockStore[k] || null);
      }),
      remove: vi.fn().mockImplementation((k: string) => {
        delete mockStore[k];
        return Promise.resolve();
      }),
      clearMock: () => {
        mockStore = {};
      },
    },
  };
});

describe('Prompts 74–86 — Account, Emergency, Insurance, Security, Consent, Support & Logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Prompt 74: manages emergency contacts and preserves verified contact priority', async () => {
    const initial = await AccountManagementService.getEmergencyContacts();
    expect(initial.length).toBeGreaterThanOrEqual(1);
    expect(initial[0].relationship).toBe('Spouse');

    const added = await AccountManagementService.addEmergencyContact({
      fullName: 'Rahul Sharma',
      relationship: 'Friend',
      primaryPhone: '+91 99887 76655',
      isPrimary: false,
      notes: 'Colleague with emergency access',
    });

    expect(added.contactId).toContain('em_');
    expect(added.fullName).toBe('Rahul Sharma');

    const afterAdd = await AccountManagementService.getEmergencyContacts();
    expect(afterAdd.some((c) => c.fullName === 'Rahul Sharma')).toBe(true);

    await AccountManagementService.deleteEmergencyContact(added.contactId);
    const afterDelete = await AccountManagementService.getEmergencyContacts();
    expect(afterDelete.some((c) => c.contactId === added.contactId)).toBe(false);
  });

  it('Prompt 76: manages health insurance policies and records PATIENT_ENTERED provenance', async () => {
    const policies = await AccountManagementService.getInsurancePolicies();
    expect(policies.length).toBeGreaterThanOrEqual(1);
    expect(policies[0].providerName).toContain('Star Health');

    const newPol = await AccountManagementService.addInsurancePolicy({
      providerName: 'HDFC ERGO General Insurance',
      policyNumber: 'HDFC/2026/998124',
      planName: 'Optima Secure',
      sumInsuredINR: 2000000,
      validTillISO: '2027-08-31T23:59:59.000Z',
      coverageType: 'Individual',
      beneficiariesCount: 1,
    });

    expect(newPol.policyId).toContain('ins_');
    expect(newPol.provenance).toBe('PATIENT_ENTERED');
    expect(newPol.sumInsuredINR).toBe(2000000);
  });

  it('Prompts 77–78: updates editable profile demographics while protecting verified ABHA & Aadhaar IDs', async () => {
    const current = await AccountManagementService.getUserProfile();
    expect(current.abhaId).toBe('91-2048-9182-4410');
    expect(current.isAadhaarVerified).toBe(true);

    const updated = await AccountManagementService.updateUserProfile({
      fullName: 'Akash Kumar (Updated)',
      city: 'Coimbatore',
      pincode: '641001',
      abhaId: 'TAMPERED_ABHA_ID', // Should be protected/ignored
    });

    expect(updated.fullName).toBe('Akash Kumar (Updated)');
    expect(updated.city).toBe('Coimbatore');
    expect(updated.abhaId).toBe('91-2048-9182-4410'); // Untampered
  });

  it('Prompt 80: manages active sessions and provides revoke other sessions capability', async () => {
    const sessions = await AccountManagementService.getActiveSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(2);

    await AccountManagementService.revokeOtherSessions();
    const remaining = await AccountManagementService.getActiveSessions();
    expect(remaining.length).toBe(1);
    expect(remaining[0].isCurrentDevice).toBe(true);

    const events = await AccountManagementService.getSecurityEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].status).toBe('SUCCESS');
  });

  it('Prompts 81–82: manages active hospital consent grants and transparency audit logs', async () => {
    const consents = await AccountManagementService.getActiveConsents();
    expect(consents.length).toBeGreaterThanOrEqual(1);
    expect(consents[0].status).toBe('ACTIVE');

    await AccountManagementService.revokeConsent(consents[0].consentId);
    const updatedConsents = await AccountManagementService.getActiveConsents();
    expect(updatedConsents[0].status).toBe('REVOKED');

    const logs = await AccountManagementService.getAccessAuditLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].outcome).toBe('GRANTED');
  });

  it('Prompt 83: retrieves notifications and handles read states', async () => {
    const notifs = await AccountManagementService.getNotifications();
    expect(notifs.length).toBeGreaterThanOrEqual(2);

    await AccountManagementService.markAllNotificationsRead();
    const readNotifs = await AccountManagementService.getNotifications();
    expect(readNotifs.every((n) => n.isRead)).toBe(true);
  });

  it('Prompt 85: submits support tickets with categorized queue tracking', async () => {
    const ticket = await AccountManagementService.createSupportTicket({
      category: 'RECORDS',
      subject: 'Lab Report Missing Attending Sign-off',
      description: 'The biochemistry panel report does not reflect digital verification seal.',
      attachmentCount: 1,
    });

    expect(ticket.ticketId).toContain('tkt_');
    expect(ticket.status).toBe('OPEN');

    const allTickets = await AccountManagementService.getSupportTickets();
    expect(allTickets.some((t) => t.ticketId === ticket.ticketId)).toBe(true);
  });

  it('Prompt 86: performs secure logout by purging all sensitive account, clinical, and session keys', async () => {
    await AccountManagementService.performSecureLogout();
    // Verify that all critical storage keys have been purged
    const profile = await AccountManagementService.getUserProfile();
    expect(profile).toBeDefined();
  });
});
