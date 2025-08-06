/**
 * DogoApp Design System & Theme Configuration
 * Unified design system with modern, accessible, and consistent UI patterns
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// BRAND COLORS
// =============================================================================
export const BrandColors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Success/Nature Colors (for dogs, nature, positive actions)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main success
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Warning/Alert Colors (for alerts, caution)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error/Emergency Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Community/Social Colors
  community: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },

  // Profile/Personal Colors
  profile: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899', // Main profile
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },

  // Neutral Grays
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

// =============================================================================
// SEMANTIC COLORS
// =============================================================================
export const SemanticColors = {
  // Light Theme Colors
  light: {
    background: BrandColors.neutral[50],
    surface: '#ffffff',
    surfaceVariant: BrandColors.neutral[100],
    
    primary: BrandColors.primary[500],
    onPrimary: '#ffffff',
    primaryContainer: BrandColors.primary[100],
    onPrimaryContainer: BrandColors.primary[900],
    
    secondary: BrandColors.success[500],
    onSecondary: '#ffffff',
    secondaryContainer: BrandColors.success[100],
    onSecondaryContainer: BrandColors.success[900],
    
    tertiary: BrandColors.warning[500],
    onTertiary: '#ffffff',
    tertiaryContainer: BrandColors.warning[100],
    onTertiaryContainer: BrandColors.warning[900],
    
    error: BrandColors.error[500],
    onError: '#ffffff',
    errorContainer: BrandColors.error[100],
    onErrorContainer: BrandColors.error[900],
    
    outline: BrandColors.neutral[300],
    outlineVariant: BrandColors.neutral[200],
    
    onBackground: BrandColors.neutral[900],
    onSurface: BrandColors.neutral[900],
    onSurfaceVariant: BrandColors.neutral[600],
    
    shadow: BrandColors.neutral[900],
    surfaceTint: BrandColors.primary[500],
  },
  
  // Dark Theme Colors
  dark: {
    background: BrandColors.neutral[900],
    surface: BrandColors.neutral[800],
    surfaceVariant: BrandColors.neutral[700],
    
    primary: BrandColors.primary[400],
    onPrimary: BrandColors.primary[900],
    primaryContainer: BrandColors.primary[800],
    onPrimaryContainer: BrandColors.primary[100],
    
    secondary: BrandColors.success[400],
    onSecondary: BrandColors.success[900],
    secondaryContainer: BrandColors.success[800],
    onSecondaryContainer: BrandColors.success[100],
    
    tertiary: BrandColors.warning[400],
    onTertiary: BrandColors.warning[900],
    tertiaryContainer: BrandColors.warning[800],
    onTertiaryContainer: BrandColors.warning[100],
    
    error: BrandColors.error[400],
    onError: BrandColors.error[900],
    errorContainer: BrandColors.error[800],
    onErrorContainer: BrandColors.error[100],
    
    outline: BrandColors.neutral[500],
    outlineVariant: BrandColors.neutral[600],
    
    onBackground: BrandColors.neutral[100],
    onSurface: BrandColors.neutral[100],
    onSurfaceVariant: BrandColors.neutral[400],
    
    shadow: '#000000',
    surfaceTint: BrandColors.primary[400],
  },
};

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================
export const Typography = {
  // Display Styles (Large headlines)
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },

  // Headlines
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.25,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },

  // Titles
  titleLarge: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },

  // Labels
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },

  // Body Text
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
};

// =============================================================================
// SPACING SYSTEM (8px grid)
// =============================================================================
export const Spacing = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 16,   // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  xxl: 40,  // 2.5rem
  xxxl: 48, // 3rem
  
  // Component specific spacing
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  card: {
    padding: 20,
    margin: 16,
  },
  screen: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
};

// =============================================================================
// BORDER RADIUS SYSTEM
// =============================================================================
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  full: 9999,
  
  // Component specific
  button: 16,
  card: 20,
  chip: 20,
  input: 12,
  modal: 24,
  fab: 28,
};

// =============================================================================
// SHADOWS & ELEVATION
// =============================================================================
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  
  md: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  
  lg: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  
  xl: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
};

// =============================================================================
// GRADIENTS
// =============================================================================
export const Gradients = {
  primary: ['#0ea5e9', '#0284c7'],
  success: ['#10b981', '#059669'],
  warning: ['#f59e0b', '#d97706'],
  error: ['#ef4444', '#dc2626'],
  community: ['#d946ef', '#c026d3'],
  profile: ['#ec4899', '#db2777'],
  
  // Neutral gradients
  lightGray: ['#f8fafc', '#f1f5f9'],
  darkGray: ['#334155', '#1e293b'],
  
  // Special gradients
  sunset: ['#ff7e5f', '#feb47b'],
  ocean: ['#667eea', '#764ba2'],
  forest: ['#11998e', '#38ef7d'],
};

// =============================================================================
// ANIMATION PRESETS
// =============================================================================
export const Animations = {
  timing: {
    fast: 150,
    medium: 300,
    slow: 500,
  },
  
  easing: {
    standard: [0.4, 0, 0.2, 1],
    decelerated: [0, 0, 0.2, 1],
    accelerated: [0.4, 0, 1, 1],
  },
  
  spring: {
    gentle: {
      tension: 120,
      friction: 8,
    },
    bouncy: {
      tension: 150,
      friction: 6,
    },
    stiff: {
      tension: 200,
      friction: 10,
    },
  },
};

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================
export const Breakpoints = {
  sm: 640,   // Small devices
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices
  xl: 1280,  // Extra large devices
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
export const getResponsiveValue = (
  baseValue: number,
  screenWidth: number = SCREEN_WIDTH
): number => {
  const scale = screenWidth / 375; // Base iPhone screen width
  return Math.round(baseValue * Math.max(scale, 0.8)); // Minimum 0.8x scale
};

export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= Breakpoints.md;
};

export const getColorWithOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// =============================================================================
// THEME OBJECT
// =============================================================================
export const LightTheme = {
  colors: SemanticColors.light,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  gradients: Gradients,
  animations: Animations,
};

export const DarkTheme = {
  colors: SemanticColors.dark,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  gradients: Gradients,
  animations: Animations,
};

// Default theme export
export const Theme = LightTheme;

// =============================================================================
// TAB NAVIGATION COLORS
// =============================================================================
export const TabColors = {
  home: {
    color: BrandColors.primary[500],
    gradient: [BrandColors.primary[500], BrandColors.primary[600]],
  },
  maps: {
    color: BrandColors.success[500],
    gradient: [BrandColors.success[500], BrandColors.success[600]],
  },
  community: {
    color: BrandColors.warning[500],
    gradient: [BrandColors.warning[500], BrandColors.warning[600]],
  },
  profile: {
    color: BrandColors.profile[500],
    gradient: [BrandColors.profile[500], BrandColors.profile[600]],
  },
  camera: {
    color: BrandColors.community[500],
    gradient: [BrandColors.community[500], BrandColors.community[600]],
  },
};

// =============================================================================
// COMPONENT VARIANTS
// =============================================================================
export const ComponentVariants = {
  button: {
    primary: {
      backgroundColor: BrandColors.primary[500],
      color: '#ffffff',
      borderRadius: BorderRadius.button,
      ...Shadows.md,
    },
    secondary: {
      backgroundColor: BrandColors.success[500],
      color: '#ffffff',
      borderRadius: BorderRadius.button,
      ...Shadows.md,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: BrandColors.primary[500],
      color: BrandColors.primary[500],
      borderRadius: BorderRadius.button,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: BrandColors.primary[500],
      borderRadius: BorderRadius.button,
    },
  },
  
  card: {
    elevated: {
      backgroundColor: '#ffffff',
      borderRadius: BorderRadius.card,
      ...Shadows.lg,
    },
    outlined: {
      backgroundColor: '#ffffff',
      borderRadius: BorderRadius.card,
      borderWidth: 1,
      borderColor: BrandColors.neutral[200],
    },
    filled: {
      backgroundColor: BrandColors.neutral[50],
      borderRadius: BorderRadius.card,
    },
  },
};

export default Theme;
