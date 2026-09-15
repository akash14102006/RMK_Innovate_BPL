import { describe, it, expect, vi, beforeEach } from 'vitest';
import HospitalCheckInService from '../HospitalCheckInService';

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
    },
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
  };
});

describe('Prompts 61–62 — Hospital Check-In & Live Queue Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves active check-in record with hospital context and queue position (Prompt 61)', async () => {
    const current = await HospitalCheckInService.getCurrentCheckIn();
    expect(current).not.toBeNull();
    expect(current?.hospitalName).toBe('Rajiv Gandhi Government General Hospital');
    expect(current?.departmentName).toBe('Cardiology Outpatient Department');
    expect(current?.tokenNumber).toBe('T-108');
    expect(current?.queuePosition).toBe(4);
    expect(current?.status).toBe('WAITING');
  });

  it('creates new check-in record from point-of-care QR exchange (Prompt 61)', async () => {
    const newCheckIn = await HospitalCheckInService.createCheckIn({
      hospitalId: 'hosp_chennai_02',
      hospitalName: 'Apollo Specialty Hospital',
      departmentName: 'Comprehensive Oncology',
      serviceName: 'Medical Oncology Consultation',
      counterDesk: 'Desk 1',
      tokenNumber: 'T-204',
    });

    expect(newCheckIn.hospitalId).toBe('hosp_chennai_02');
    expect(newCheckIn.hospitalName).toBe('Apollo Specialty Hospital');
    expect(newCheckIn.tokenNumber).toBe('T-204');
    expect(newCheckIn.status).toBe('WAITING');
  });

  it('cancels active check-in on server and updates status to CANCELLED (Prompt 61)', async () => {
    const cancelled = await HospitalCheckInService.cancelCheckIn('chk_chennai_902');
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.queuePosition).toBeUndefined();
    expect(cancelled.isLive).toBe(false);
  });

  it('subscribes to live queue events and supports terminal state stop (Prompt 62)', () => {
    const onUpdate = vi.fn();
    const unsubscribe = HospitalCheckInService.subscribeToLiveCheckIn('chk_chennai_902', onUpdate);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
