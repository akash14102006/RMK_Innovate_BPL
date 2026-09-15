import { describe, it, expect } from 'vitest';
import { IVRDistanceFormatter } from '../../../src/modules/ivr/voice/IVRDistanceFormatter.js';

describe('IVRDistanceFormatter — Spoken Distance Localization', () => {
  it('formats sub-kilometer distances rounded to nearest 50 meters in English', () => {
    expect(IVRDistanceFormatter.formatForVoice(842, 'en')).toBe('approximately 850 meters');
    expect(IVRDistanceFormatter.formatForVoice(490, 'en')).toBe('approximately 500 meters');
    expect(IVRDistanceFormatter.formatForVoice(30, 'en')).toBe('approximately 50 meters');
  });

  it('formats kilometer distances to 1 decimal place in English', () => {
    expect(IVRDistanceFormatter.formatForVoice(1000, 'en')).toBe('approximately 1 kilometer');
    expect(IVRDistanceFormatter.formatForVoice(2140, 'en')).toBe('approximately 2.1 kilometers');
    expect(IVRDistanceFormatter.formatForVoice(3200, 'en')).toBe('approximately 3.2 kilometers');
  });

  it('formats distances in Tamil with natural spoken wording', () => {
    expect(IVRDistanceFormatter.formatForVoice(850, 'ta')).toBe('சுமார் 850 மீட்டர்கள்');
    expect(IVRDistanceFormatter.formatForVoice(1000, 'ta')).toBe('சுமார் 1 கிலோமீட்டர்');
    expect(IVRDistanceFormatter.formatForVoice(3200, 'ta')).toBe('சுமார் 3.2 கிலோமீட்டர்');
  });

  it('formats distances in Hindi with natural spoken wording', () => {
    expect(IVRDistanceFormatter.formatForVoice(500, 'hi')).toBe('लगभग 500 मीटर');
    expect(IVRDistanceFormatter.formatForVoice(2100, 'hi')).toBe('लगभग 2.1 किलोमीटर');
    expect(IVRDistanceFormatter.formatForVoice(4500, 'hi')).toBe('लगभग 4.5 किलोमीटर');
  });
});
