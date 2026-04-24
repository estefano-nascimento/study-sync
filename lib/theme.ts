export const lightColors = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#2F5BFF',
  accent: '#19C2C9',
  textPrimary: '#1E2430',
  textSecondary: '#667085',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
};

export const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  primary: '#5B8CFF',
  accent: '#22D3EE',
  textPrimary: '#E5E7EB',
  textSecondary: '#94A3B8',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  border: '#334155',
};

export type ColorScheme = typeof lightColors;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  timer: { fontSize: 72, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as any },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};
