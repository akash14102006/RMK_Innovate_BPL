import { describe, it, expect, vi } from 'vitest';
import HomeDashboardService from '../HomeDashboardService';
import ProfileDraftService from '../ProfileDraftService';
import { createDefaultProfileDraft } from '../../types/profile';

vi.mock('../secureStore', () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => store.get(k) || null),
    remove: vi.fn(async (k: string) => { store.delete(k); }),
    default: {
      set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
      get: vi.fn(async (k: string) => store.get(k) || null),
      remove: vi.fn(async (k: string) => { store.delete(k); }),
    },
  };
});

describe('HomeDashboardService Logic & Premium Redesign (Prompt 37)', () => {
  it('returns valid time of day greeting', () => {
    const greeting = HomeDashboardService.getTimeGreeting();
    expect(['Good Morning', 'Good Afternoon', 'Good Evening']).toContain(greeting);
  });

  it('calculates real-time profile completion percentage and status honestly', async () => {
    const draft = createDefaultProfileDraft('user_test_progress', '+91 98765 43210');
    draft.basic.fullName = 'Priya Raman';
    draft.basic.dateOfBirth = '1995-05-12';
    draft.basic.gender = 'FEMALE';
    await ProfileDraftService.saveDraft(draft);

    const dashboard = await HomeDashboardService.getDashboardData('user_test_progress');

    expect(dashboard.patientFullName).toBe('Priya Raman');
    expect(dashboard.patientPreferredName).toBe('Priya');
    expect(dashboard.profileCompletionPercentage).toBeGreaterThan(10);
    expect(dashboard.profileCompletionPercentage).toBeLessThan(100);
    expect(dashboard.isProfileComplete).toBe(false);
    expect(dashboard.healthSnapshot.statusBadge).toBe(`${dashboard.profileCompletionPercentage}% Complete`);
  });

  it('derives dynamic attention priority item for missing emergency contact', async () => {
    const draft = createDefaultProfileDraft('user_test_attention', '+91 98765 43210');
    draft.basic.fullName = 'Kavita Singh';
    draft.basic.dateOfBirth = '1990-08-20';
    // Emergency contact not filled
    await ProfileDraftService.saveDraft(draft);

    const dashboard = await HomeDashboardService.getDashboardData('user_test_attention');

    expect(dashboard.attentionItem).toBeDefined();
    expect(dashboard.attentionItem?.priority).toBe('HIGH');
    expect(dashboard.attentionItem?.targetStepId).toBe('emergencyContact');
  });

  it('derives authentic recent activity and hospital discovery preview', async () => {
    const draft = createDefaultProfileDraft('user_test_activity', '+91 98765 43210');
    draft.basic.fullName = 'Rohan Verma';
    draft.contact.city = 'Bengaluru';
    draft.emergencyContact = {
      contactName: 'Sunita Verma',
      relationship: 'SPOUSE',
      primaryPhone: '+91 98765 43211',
    };
    draft.documents = [
      {
        id: 'doc_1',
        category: 'PRESCRIPTION',
        fileName: 'BloodTest_Aug2026.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
        secureReferenceUri: 'sec://doc_1',
        uploadedAt: new Date().toISOString(),
      },
    ];
    await ProfileDraftService.saveDraft(draft);

    const dashboard = await HomeDashboardService.getDashboardData('user_test_activity');

    expect(dashboard.recentActivity.length).toBeGreaterThan(0);
    expect(dashboard.recentActivity[0].title).toContain('Medical Record Encrypted');
    expect(dashboard.hospitalDiscovery).toBeDefined();
    expect(dashboard.hospitalDiscovery.hospitalName).toContain('Bengaluru');
    expect(dashboard.hospitalDiscovery.emergencyAvailable).toBe(true);
  });

  it('reflects 100% complete and clears attention items when fully complete', async () => {
    const draft = createDefaultProfileDraft('user_test_completed', '+91 98765 43210');
    draft.basic.fullName = 'Ananya Sen';
    draft.basic.dateOfBirth = '1994-03-14';
    draft.basic.gender = 'FEMALE';
    draft.emergencyContact = {
      contactName: 'Deb Sen',
      relationship: 'PARENT',
      primaryPhone: '+91 98765 43219',
    };
    draft.identification = {
      bloodGroup: 'O+',
    };
    draft.securityConsent = {
      storeHealthDataConsent: true,
    };
    draft.isComplete = true;
    await ProfileDraftService.saveDraft(draft);

    const dashboard = await HomeDashboardService.getDashboardData('user_test_completed');

    expect(dashboard.profileCompletionPercentage).toBe(100);
    expect(dashboard.isProfileComplete).toBe(true);
    expect(dashboard.healthSnapshot.statusBadge).toBe('100% Complete');
    expect(dashboard.attentionItem).toBeNull();
  });
});
