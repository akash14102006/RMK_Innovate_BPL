import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  formatTime,
  formatDistance,
} from '../utils/formatters';

describe('Locale-Aware Formatting Utilities', () => {
  it('formats numbers properly in en-IN and hi-IN', () => {
    const num = 1250000;
    const formattedEn = formatNumber(num, 'en-IN');
    expect(formattedEn).toContain('12,50,000'); // Indian number system grouping

    const zero = formatNumber(0, 'en-IN');
    expect(zero).toBe('0');
  });

  it('formats currency in INR', () => {
    const formatted = formatCurrency(450, 'en-IN');
    expect(formatted).toContain('450');
    expect(formatted).toContain('₹');
  });

  it('formats physical distance in meters preserving underlying numeric precision', () => {
    // Meters (< 1000m)
    expect(formatDistance(350, 'en-IN')).toBe('350 m');
    expect(formatDistance(350, 'hi-IN')).toBe('350 मी');
    expect(formatDistance(350, 'ta-IN')).toBe('350 மீ');

    // Kilometers (>= 1000m)
    expect(formatDistance(2340, 'en-IN')).toBe('2.3 km');
    expect(formatDistance(2340, 'hi-IN')).toBe('2.3 किमी');
    expect(formatDistance(2340, 'ta-IN')).toBe('2.3 கி.மீ.');
    expect(formatDistance(2340, 'te-IN')).toBe('2.3 కి.మీ.');
    expect(formatDistance(2340, 'ur-IN')).toContain('کلومیٹر');
  });

  it('formats dates and times', () => {
    const fixedDate = new Date('2026-08-15T10:30:00.000Z');
    const formattedDate = formatDate(fixedDate, 'en-IN');
    expect(formattedDate).toBeTruthy();
    expect(formattedDate).toContain('2026');

    const formattedTime = formatTime(fixedDate, 'en-IN');
    expect(formattedTime).toBeTruthy();
  });
});
