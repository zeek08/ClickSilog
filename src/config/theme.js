// Modern, elegant, professional design system
// Refined yellow accent with neutral palette

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold'
};

// Design tokens for scalability - 8px spacing system
export const lightTheme = {
  mode: 'light',
  colors: {
    // Primary: Refined, sophisticated yellow (#FFD54F)
    primary: '#FFD54F', // Soft, elegant yellow
    primaryLight: '#FFECB3', // Light yellow for containers
    primaryDark: '#F9A825', // Deeper yellow for emphasis
    primaryContainer: '#FFF8E1', // Very light yellow background
    
    // Secondary: Complementary colors
    secondary: '#7C3AED', // Purple
    secondaryLight: '#A78BFA',
    secondaryDark: '#5B21B6',
    
    // Background & Surface - Clean, minimal
    background: '#FAFAFA', // Off-white background
    surface: '#FFFFFF', // Pure white cards
    surfaceVariant: '#F5F5F5', // Subtle variant
    
    // Text hierarchy - Professional contrast
    text: '#1E1E1E', // Charcoal primary text
    textSecondary: '#6D6D6D', // Muted gray-blue secondary
    textTertiary: '#9E9E9E', // Tertiary/muted text
    onPrimary: '#1E1E1E', // Dark text on yellow
    onSurface: '#1E1E1E',
    
    // Semantic colors
    error: '#DC2626',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    success: '#10B981',
    successLight: '#D1FAE5',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    
    // Borders & Dividers - Subtle, clean
    border: '#E0E0E0',
    borderLight: '#F5F5F5',
    divider: '#E0E0E0',
    
    // Shadows - Subtle elevation (reduced)
    shadow: '#000000',
    shadowLight: 'rgba(0, 0, 0, 0.03)',
    
    // Elevation - Minimal, elegant
    elevation1: 'rgba(0, 0, 0, 0.03)',
    elevation2: 'rgba(0, 0, 0, 0.05)',
    elevation3: 'rgba(0, 0, 0, 0.08)',
    
    // Accent
    accent: '#3B82F6',
    accentLight: '#93C5FD',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,   // 1 * 8px
    md: 12,  // 1.5 * 8px
    lg: 16,  // 2 * 8px
    xl: 20,  // 2.5 * 8px
    xxl: 24, // 3 * 8px
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, lineHeight: 40, fontFamily: fonts.bold },
    h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, lineHeight: 32, fontFamily: fonts.bold },
    h3: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2, lineHeight: 28, fontFamily: fonts.semiBold },
    h4: { fontSize: 18, fontWeight: '600', letterSpacing: 0, lineHeight: 24, fontFamily: fonts.semiBold },
    body: { fontSize: 16, fontWeight: '400', letterSpacing: 0.1, lineHeight: 24, fontFamily: fonts.regular },
    bodyBold: { fontSize: 16, fontWeight: '600', letterSpacing: 0.1, lineHeight: 24, fontFamily: fonts.semiBold },
    bodyMedium: { fontSize: 16, fontWeight: '500', letterSpacing: 0.1, lineHeight: 24, fontFamily: fonts.medium },
    caption: { fontSize: 14, fontWeight: '400', letterSpacing: 0.2, lineHeight: 20, fontFamily: fonts.regular },
    captionBold: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2, lineHeight: 20, fontFamily: fonts.semiBold },
    overline: { fontSize: 12, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 16, fontFamily: fonts.medium },
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    // Primary: Warm yellow for dark mode (not oversaturated)
    primary: '#FFD54F', // Warm, elegant yellow
    primaryLight: '#FFECB3', // Light yellow for containers
    primaryDark: '#F9A825', // Deeper yellow
    primaryContainer: '#4E342E', // Deep brown container
    
    // Secondary
    secondary: '#A78BFA', // Light purple
    secondaryLight: '#C4B5FD',
    secondaryDark: '#7C3AED',
    
    // Background & Surface - Deep charcoal (no pure black)
    background: '#1E1E1E', // Deep charcoal background
    surface: '#2C2C2C', // Slightly lighter charcoal
    surfaceVariant: '#3A3A3A', // Variant surface
    
    // Text hierarchy - Warm, readable
    text: '#F5F5F5', // Near white primary text
    textSecondary: '#BDBDBD', // Muted secondary
    textTertiary: '#9E9E9E', // Tertiary text
    onPrimary: '#1E1E1E', // Dark text on yellow
    onSurface: '#F5F5F5',
    
    // Semantic colors
    error: '#EF4444',
    errorLight: '#7F1D1D',
    warning: '#FCD34D',
    warningLight: '#78350F',
    success: '#34D399',
    successLight: '#064E3B',
    info: '#60A5FA',
    infoLight: '#1E3A8A',
    
    // Borders & Dividers - Subtle, warm
    border: '#3A3A3A',
    borderLight: '#4A4A4A',
    divider: '#3A3A3A',
    
    // Shadows - Subtle (reduced)
    shadow: '#000000',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    
    // Elevation - Minimal, elegant
    elevation1: 'rgba(0, 0, 0, 0.15)',
    elevation2: 'rgba(0, 0, 0, 0.2)',
    elevation3: 'rgba(0, 0, 0, 0.25)',
    
    // Accent
    accent: '#60A5FA',
    accentLight: '#3B82F6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,   // 1 * 8px
    md: 12,  // 1.5 * 8px
    lg: 16,  // 2 * 8px
    xl: 20,  // 2.5 * 8px
    xxl: 24, // 3 * 8px
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, lineHeight: 40, fontFamily: fonts.bold },
    h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, lineHeight: 32, fontFamily: fonts.bold },
    h3: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2, lineHeight: 28, fontFamily: fonts.semiBold },
    h4: { fontSize: 18, fontWeight: '600', letterSpacing: 0, lineHeight: 24, fontFamily: fonts.semiBold },
    body: { fontSize: 16, fontWeight: '400', letterSpacing: 0.1, lineHeight: 24, fontFamily: fonts.regular },
    bodyBold: { fontSize: 16, fontWeight: '600', letterSpacing: 0.1, lineHeight: 24, fontFamily: fonts.semiBold },
    bodyMedium: { fontSize: 16, fontWeight: '500', letterSpacing: 0.1, lineHeight: 24, fontFamily: fonts.medium },
    caption: { fontSize: 14, fontWeight: '400', letterSpacing: 0.2, lineHeight: 20, fontFamily: fonts.regular },
    captionBold: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2, lineHeight: 20, fontFamily: fonts.semiBold },
    overline: { fontSize: 12, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 16, fontFamily: fonts.medium },
  },
};
