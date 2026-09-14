/**
 * OrbitPulse Unified Theme System
 * Supports System, Light, and Dark appearance modes with a restrained, technical space operations aesthetic.
 */

export type ThemeMode = 'system' | 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundAlt: string;
  surface: string;
  raisedSurface: string;
  surfaceBorder: string;
  surfaceBorderActive: string;
  
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  primaryAccent: string;
  
  // Selection System
  selectedSurface: string;
  selectedText: string;
  selectedIndicator: string;
  
  // Semantic Telemetry Signals
  live: string;
  liveMuted: string;
  warning: string;
  warningMuted: string;
  critical: string;
  criticalMuted: string;

  cardShadow: string;
  overlay: string;
}

export const darkColors: ThemeColors = {
  background: '#080C14',
  backgroundAlt: '#0B101D',
  surface: '#101722',
  raisedSurface: '#151E2B',
  surfaceBorder: 'rgba(91, 156, 255, 0.18)',
  surfaceBorderActive: '#5B9CFF',
  
  textPrimary: '#E7EDF5',
  textSecondary: '#CBD5E1',
  textMuted: '#8290A3',
  
  primaryAccent: '#5B9CFF',
  
  selectedSurface: '#182A40',
  selectedText: '#A9CEFF',
  selectedIndicator: '#5B9CFF',
  
  live: '#63C58A',
  liveMuted: 'rgba(99, 197, 138, 0.18)',
  warning: '#D9A441',
  warningMuted: 'rgba(217, 164, 65, 0.18)',
  critical: '#D96B6B',
  criticalMuted: 'rgba(217, 107, 107, 0.18)',

  cardShadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(8, 12, 20, 0.85)',
};

export const lightColors: ThemeColors = {
  background: '#F1F5F9',
  backgroundAlt: '#E2E8F0',
  surface: '#FFFFFF',
  raisedSurface: '#F8FAFC',
  surfaceBorder: 'rgba(91, 156, 255, 0.25)',
  surfaceBorderActive: '#5B9CFF',
  
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  
  primaryAccent: '#5B9CFF',
  
  selectedSurface: '#E0EDFF',
  selectedText: '#1E40AF',
  selectedIndicator: '#5B9CFF',
  
  live: '#16A34A',
  liveMuted: 'rgba(22, 163, 74, 0.15)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.15)',
  critical: '#DC2626',
  criticalMuted: 'rgba(220, 38, 38, 0.15)',

  cardShadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(241, 245, 249, 0.85)',
};

export const theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    pill: 999,
  },
};
