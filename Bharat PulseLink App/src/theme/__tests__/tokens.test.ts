import { describe, it, expect } from 'vitest';
import { colors, spacing, radii, typography, shadows } from '../tokens';
import motionTokens from '../motion';

describe('Design Tokens Integrity', () => {
  it('contains expected primary and status color tokens', () => {
    expect(colors.primary).toBe('#0B4F6C');
    expect(colors.accent).toBe('#00A896');
    expect(colors.success).toBe('#059669');
    expect(colors.danger).toBe('#DC2626');
  });

  it('defines standard spacing grid tokens', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
  });

  it('defines radii and elevation tokens', () => {
    expect(radii.md).toBe(8);
    expect(shadows.md.elevation).toBe(3);
  });

  it('defines motion duration tokens', () => {
    expect(motionTokens.duration.normal).toBe(300);
    expect(motionTokens.duration.instant).toBe(0);
  });
});
