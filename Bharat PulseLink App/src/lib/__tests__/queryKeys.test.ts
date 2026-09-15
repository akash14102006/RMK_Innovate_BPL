import { describe, it, expect } from 'vitest';
import queryKeys from '../queryKeys';

describe('Query Keys Factory', () => {
  it('generates predictable auth query keys', () => {
    expect(queryKeys.auth.session()).toEqual(['auth', 'session']);
    expect(queryKeys.auth.userProfile()).toEqual(['auth', 'userProfile']);
  });

  it('generates predictable hospital query keys with parameters', () => {
    expect(queryKeys.hospitals.detail('hsp-123')).toEqual(['hospitals', 'detail', 'hsp-123']);
    expect(queryKeys.hospitals.nearby({ radiusKm: 10 })).toEqual([
      'hospitals',
      'nearby',
      { radiusKm: 10 },
    ]);
  });

  it('generates health record query keys', () => {
    expect(queryKeys.healthRecords.summary()).toEqual(['healthRecords', 'summary']);
    expect(queryKeys.healthRecords.reports('blood')).toEqual(['healthRecords', 'reports', 'blood']);
  });
});
