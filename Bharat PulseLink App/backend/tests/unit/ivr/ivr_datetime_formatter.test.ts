import { describe, it, expect } from 'vitest';
import { IVRDateTimeFormatter } from '../../../src/modules/ivr/voice/IVRDateTimeFormatter.js';

describe('IVRDateTimeFormatter — Spoken Date & Time Localization', () => {
  it('formats dates into English days of the week', () => {
    // 2026-09-01 is Tuesday
    expect(IVRDateTimeFormatter.formatDateForVoice('2026-09-01', 'en')).toBe('Tuesday');
    expect(IVRDateTimeFormatter.formatDateForVoice('2026-09-02', 'en')).toBe('Wednesday');
  });

  it('formats dates into Tamil days of the week', () => {
    expect(IVRDateTimeFormatter.formatDateForVoice('2026-09-01', 'ta')).toBe('செவ்வாய்க்கிழமை');
    expect(IVRDateTimeFormatter.formatDateForVoice('2026-09-02', 'ta')).toBe('புதன்கிழமை');
  });

  it('formats dates into Hindi days of the week', () => {
    expect(IVRDateTimeFormatter.formatDateForVoice('2026-09-01', 'hi')).toBe('मंगलवार');
    expect(IVRDateTimeFormatter.formatDateForVoice('2026-09-02', 'hi')).toBe('बुधवार');
  });

  it('formats morning and afternoon times in English', () => {
    expect(IVRDateTimeFormatter.formatTimeForVoice('10:00', 'en')).toBe('10 AM');
    expect(IVRDateTimeFormatter.formatTimeForVoice('11:30', 'en')).toBe('11:30 AM');
    expect(IVRDateTimeFormatter.formatTimeForVoice('14:00', 'en')).toBe('2 PM');
  });

  it('formats times in Tamil with morning/afternoon period prefixes', () => {
    expect(IVRDateTimeFormatter.formatTimeForVoice('10:00', 'ta')).toBe('காலை 10 மணி');
    expect(IVRDateTimeFormatter.formatTimeForVoice('11:30', 'ta')).toBe('காலை 11:30 மணி');
    expect(IVRDateTimeFormatter.formatTimeForVoice('14:00', 'ta')).toBe('மதியம் 2 மணி');
  });

  it('formats times in Hindi with morning/afternoon period prefixes', () => {
    expect(IVRDateTimeFormatter.formatTimeForVoice('10:00', 'hi')).toBe('सुबह 10 बजे');
    expect(IVRDateTimeFormatter.formatTimeForVoice('11:30', 'hi')).toBe('सुबह 11:30 बजे');
    expect(IVRDateTimeFormatter.formatTimeForVoice('14:00', 'hi')).toBe('दोपहर 2 बजे');
  });
});
