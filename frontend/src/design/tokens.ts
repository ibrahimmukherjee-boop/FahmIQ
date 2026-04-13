import { Platform } from 'react-native';

export const Colors = {
  dark: {
    background: '#0C0C10',
    surface: '#141418',
    surfaceElevated: '#1E1E26',
    surfaceCard: '#232330',
    border: 'rgba(255,255,255,0.07)',
    accent: '#5B6EF5',
    accentHover: '#4355E8',
    accentMuted: 'rgba(91,110,245,0.12)',
    textPrimary: '#EEEEF5',
    textSecondary: '#9090A8',
    textFaint: '#55556A',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    divider: 'rgba(255,255,255,0.05)',
    cardHighlight: 'rgba(255,255,255,0.04)',
  },
  light: {
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F0F4',
    surfaceCard: '#FFFFFF',
    border: 'rgba(0,0,0,0.08)',
    accent: '#5B6EF5',
    accentHover: '#4355E8',
    accentMuted: 'rgba(91,110,245,0.08)',
    textPrimary: '#1A1A2E',
    textSecondary: '#6B6B80',
    textFaint: '#9999AA',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    divider: 'rgba(0,0,0,0.06)',
    cardHighlight: 'rgba(0,0,0,0.02)',
  },
} as const;

export type ThemeColors = typeof Colors.dark;

export const Typography = {
  heroTitle: { fontSize: 28, fontWeight: '700' as const, fontFamily: Platform.select({ ios: '-apple-system', default: 'System' }) },
  sectionHeading: { fontSize: 20, fontWeight: '600' as const, fontFamily: Platform.select({ ios: '-apple-system', default: 'System' }) },
  subheading: { fontSize: 16, fontWeight: '600' as const, fontFamily: Platform.select({ ios: '-apple-system', default: 'System' }) },
  body: { fontSize: 15, fontWeight: '400' as const, fontFamily: Platform.select({ ios: '-apple-system', default: 'System' }) },
  caption: { fontSize: 13, fontWeight: '400' as const, fontFamily: Platform.select({ ios: '-apple-system', default: 'System' }) },
  micro: { fontSize: 11, fontWeight: '500' as const, fontFamily: Platform.select({ ios: '-apple-system', default: 'System' }) },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
