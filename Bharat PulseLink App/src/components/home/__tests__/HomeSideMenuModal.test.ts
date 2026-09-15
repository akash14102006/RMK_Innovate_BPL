import { describe, it, expect } from 'vitest';
import { DRAWER_NAV_ITEMS } from '../../../navigation/drawerRegistry';

describe('Prompt 38 — Production Dashboard Navigation Drawer Registry', () => {
  it('registers all 10 required navigation items exactly according to specification', () => {
    expect(DRAWER_NAV_ITEMS.length).toBe(10);

    const ids = DRAWER_NAV_ITEMS.map((i) => i.id);
    expect(ids).toEqual([
      'home',
      'hospitals',
      'scan',
      'records',
      'medications',
      'appointments',
      'alerts',
      'profile',
      'support',
      'logout',
    ]);
  });

  it('matches exact title and subtitle hierarchy from reference specification', () => {
    const itemMap = new Map(DRAWER_NAV_ITEMS.map((i) => [i.id, i]));

    expect(itemMap.get('home')?.title).toBe('Home');
    expect(itemMap.get('home')?.subtitle).toBe('Dashboard Overview');

    expect(itemMap.get('hospitals')?.title).toBe('Hospitals');
    expect(itemMap.get('hospitals')?.subtitle).toBe('Find & Book Hospital');

    expect(itemMap.get('scan')?.title).toBe('Scan at Hospital');
    expect(itemMap.get('scan')?.subtitle).toBe('QR Scan & Check-In');

    expect(itemMap.get('records')?.title).toBe('Health Records');
    expect(itemMap.get('records')?.subtitle).toBe('Reports & History');

    expect(itemMap.get('medications')?.title).toBe('Medications');
    expect(itemMap.get('medications')?.subtitle).toBe('Your Medicines');

    expect(itemMap.get('appointments')?.title).toBe('Appointments');
    expect(itemMap.get('appointments')?.subtitle).toBe('Your Bookings');

    expect(itemMap.get('alerts')?.title).toBe('Alerts');
    expect(itemMap.get('alerts')?.subtitle).toBe('Health Alerts & Reminders');
    expect(itemMap.get('alerts')?.hasBadge).toBe(true);

    expect(itemMap.get('profile')?.title).toBe('Profile');
    expect(itemMap.get('profile')?.subtitle).toBe('My Profile & Settings');

    expect(itemMap.get('support')?.title).toBe('Help & Support');
    expect(itemMap.get('support')?.subtitle).toBe('Support Center');

    expect(itemMap.get('logout')?.title).toBe('Logout');
    expect(itemMap.get('logout')?.subtitle).toBe('Sign Out');
  });

  it('categorizes items into structured functional sections', () => {
    const sections = Array.from(new Set(DRAWER_NAV_ITEMS.map((i) => i.section)));
    expect(sections).toContain('OVERVIEW');
    expect(sections).toContain('CARE');
    expect(sections).toContain('HEALTH');
    expect(sections).toContain('ACCOUNT');
    expect(sections).toContain('SUPPORT');
    expect(sections).toContain('SESSION');
  });
});
