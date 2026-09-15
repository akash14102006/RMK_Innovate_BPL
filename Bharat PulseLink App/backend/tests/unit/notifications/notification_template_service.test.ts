import { describe, it, expect } from 'vitest';
import { NotificationTemplateService } from '../../../src/modules/notifications/NotificationTemplateService.js';
import { AppError } from '../../../src/core/errors/AppError.js';

describe('NotificationTemplateService — Localized SMS Confirmation Templates', () => {
  const service = new NotificationTemplateService();

  it('renders English appointment confirmation template', () => {
    const text = service.renderAppointmentConfirmation({
      language: 'en',
      hospitalName: 'Government General Hospital',
      date: 'Monday, September 2nd',
      time: '10:00 AM',
      bookingReference: 'BP-600001-9872',
    });

    expect(text).toContain('Bharat PulseLink: Your appointment is confirmed at Government General Hospital');
    expect(text).toContain('Date: Monday, September 2nd');
    expect(text).toContain('Time: 10:00 AM');
    expect(text).toContain('Booking Ref: BP-600001-9872');
  });

  it('renders Tamil appointment confirmation template', () => {
    const text = service.renderAppointmentConfirmation({
      language: 'ta',
      hospitalName: 'அரசு பொது மருத்துவமனை',
      date: 'திங்கட்கிழமை',
      time: 'காலை 10 மணி',
      bookingReference: 'BP-600001-9872',
    });

    expect(text).toContain('பாரத் பல்ஸ்லிங்க்');
    expect(text).toContain('அரசு பொது மருத்துவமனை');
    expect(text).toContain('BP-600001-9872');
  });

  it('renders Hindi appointment confirmation template', () => {
    const text = service.renderAppointmentConfirmation({
      language: 'hi',
      hospitalName: 'सरकारी अस्पताल',
      date: 'सोमवार',
      time: 'सुबह 10 बजे',
      bookingReference: 'BP-110001-9872',
    });

    expect(text).toContain('भारत पल्सलिंक');
    expect(text).toContain('सरकारी अस्पताल');
    expect(text).toContain('BP-110001-9872');
  });

  it('sanitizes newline and control injection from parameters', () => {
    const text = service.renderAppointmentConfirmation({
      language: 'en',
      hospitalName: 'City Hospital\r\nSpecialist Wing\n\t',
      date: '2026-09-02',
      time: '10:00 AM',
      bookingReference: 'BP-1234',
    });

    expect(text).not.toContain('\r');
    expect(text).not.toContain('\n');
    expect(text).toContain('City Hospital Specialist Wing');
  });

  it('rejects missing hospital or booking reference', () => {
    expect(() =>
      service.renderAppointmentConfirmation({
        language: 'en',
        hospitalName: '',
        date: '2026-09-02',
        time: '10:00 AM',
        bookingReference: 'BP-1234',
      }),
    ).toThrow(AppError);

    expect(() =>
      service.renderAppointmentConfirmation({
        language: 'en',
        hospitalName: 'City Hospital',
        date: '2026-09-02',
        time: '10:00 AM',
        bookingReference: '',
      }),
    ).toThrow(AppError);
  });

  it('returns structured metadata with templateKey, templateVersion, and language', () => {
    const meta = service.renderWithMetadata({
      language: 'ta',
      hospitalName: 'அரசு மருத்துவமனை',
      date: 'செப்டம்பர் 2',
      time: '10:00 AM',
      bookingReference: 'BP-600001-9999',
    });

    expect(meta.templateKey).toBe('sms.appointment-confirmed.ta');
    expect(meta.templateVersion).toBe('1.0.0');
    expect(meta.language).toBe('ta');
    expect(meta.text).toContain('பாரத் பல்ஸ்லிங்க்');
  });

  it('rejects clinical and promotional injection attempts', () => {
    expect(() =>
      service.renderAppointmentConfirmation({
        language: 'en',
        hospitalName: 'City Hospital - Prescription refill',
        date: '2026-09-02',
        time: '10:00 AM',
        bookingReference: 'BP-1234',
      }),
    ).toThrow(AppError);

    expect(() =>
      service.renderAppointmentConfirmation({
        language: 'en',
        hospitalName: 'City Hospital - Win Money Cashback',
        date: '2026-09-02',
        time: '10:00 AM',
        bookingReference: 'BP-1234',
      }),
    ).toThrow(AppError);
  });
});
