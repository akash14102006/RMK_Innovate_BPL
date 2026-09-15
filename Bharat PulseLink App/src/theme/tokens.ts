export const colors = {
  // Brand Healthcare Palette (Calm, Premium, Infrastructure-Grade)
  primary: '#0B4F6C',
  primaryLight: '#1F7A8C',
  primaryDark: '#012A36',

  // Accent & Status Palette
  accent: '#00A896',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',

  // Neutral Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // Text Hierarchy
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverted: '#FFFFFF',

  // Special Domain Colors
  emergency: '#B91C1C',
  healthWallet: '#047857',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  titleMedium: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  titleSmall: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
};

export default { colors, spacing, radii, typography, shadows };
