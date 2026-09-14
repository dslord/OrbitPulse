/**
 * OrbitPulse Unified Design System & Theme
 * Professional space operations aesthetic inspired by JPL / NASA telemetry dashboards.
 */

export const theme = {
  colors: {
    // Primary Backgrounds
    background: '#0b0d1b',
    backgroundAlt: '#080a15',
    
    // Surfaces & Cards
    surface: 'rgba(18, 22, 44, 0.92)',
    surfaceLight: 'rgba(28, 35, 68, 0.85)',
    surfaceBorder: 'rgba(0, 212, 255, 0.18)',
    surfaceBorderActive: 'rgba(0, 212, 255, 0.5)',

    // Accents & Signals
    primary: '#00d4ff',
    primaryMuted: 'rgba(0, 212, 255, 0.15)',
    accentSecondary: '#3b82f6',
    
    // Status & Telemetry Signals
    success: '#22c55e',
    successMuted: 'rgba(34, 197, 94, 0.18)',
    warning: '#eab308',
    warningMuted: 'rgba(234, 179, 8, 0.18)',
    danger: '#ef4444',
    dangerMuted: 'rgba(239, 68, 68, 0.18)',

    // Typography
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    textDark: '#0b0d1b',

    // Overlays
    overlayDark: 'rgba(11, 13, 27, 0.85)',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },

  typography: {
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      color: '#f8fafc',
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 12,
      color: '#00d4ff',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: '#f8fafc',
    },
    cardSubtitle: {
      fontSize: 12,
      color: '#94a3b8',
      marginTop: 2,
    },
    metricLabel: {
      fontSize: 10,
      color: '#94a3b8',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    metricValue: {
      fontSize: 15,
      fontWeight: 'bold' as const,
      color: '#f8fafc',
      marginTop: 2,
    },
  },
};
