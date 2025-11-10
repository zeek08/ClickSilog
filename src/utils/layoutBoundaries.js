import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12 - 390x844) - Updated for modern smartphones
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 320,   // Small phones
  sm: 375,   // Standard phones
  md: 414,   // Large phones
  lg: 768,   // Tablets
  xl: 1024,  // Large tablets
};

// Get current breakpoint
export const getCurrentBreakpoint = () => {
  if (SCREEN_WIDTH >= BREAKPOINTS.xl) return 'xl';
  if (SCREEN_WIDTH >= BREAKPOINTS.lg) return 'lg';
  if (SCREEN_WIDTH >= BREAKPOINTS.md) return 'md';
  if (SCREEN_WIDTH >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Responsive scaling functions
export const scaleWidth = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

export const scaleHeight = (size) => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

export const scaleFont = (size) => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.2); // Cap at 1.2x
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

// Responsive spacing system
export const getResponsiveSpacing = (baseSpacing, breakpoint = null) => {
  const currentBreakpoint = breakpoint || getCurrentBreakpoint();
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.2); // Cap at 1.2x
  
  // Adjust spacing based on breakpoint
  const breakpointMultiplier = {
    xs: 0.9,  // Slightly smaller on very small screens
    sm: 1.0,  // Base size
    md: 1.05, // Slightly larger
    lg: 1.1,  // Larger on tablets
    xl: 1.15, // Largest on big tablets
  };
  
  const multiplier = breakpointMultiplier[currentBreakpoint] || 1.0;
  return Math.round(PixelRatio.roundToNearestPixel(baseSpacing * scale * multiplier));
};

// Spacing tokens (xs, sm, md, lg, xl)
export const SPACING_TOKENS = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Get responsive spacing token
export const getSpacing = (token = 'md') => {
  const baseSpacing = SPACING_TOKENS[token] || SPACING_TOKENS.md;
  return getResponsiveSpacing(baseSpacing);
};

// Percentage-based width
export const widthPercentage = (percentage) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Percentage-based height
export const heightPercentage = (percentage) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Get screen dimensions with breakpoint info
export const getScreenDimensions = () => {
  const breakpoint = getCurrentBreakpoint();
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    breakpoint,
    isSmallDevice: SCREEN_WIDTH < BREAKPOINTS.sm,
    isMediumDevice: SCREEN_WIDTH >= BREAKPOINTS.sm && SCREEN_WIDTH < BREAKPOINTS.md,
    isLargeDevice: SCREEN_WIDTH >= BREAKPOINTS.md && SCREEN_WIDTH < BREAKPOINTS.lg,
    isTablet: SCREEN_WIDTH >= BREAKPOINTS.lg,
    scale: SCREEN_WIDTH / BASE_WIDTH,
  };
};

// Boundary relationship helpers
// Note: spacing parameter accepts spacing token names ('xs', 'sm', 'md', 'lg', 'xl')
export const BOUNDARY_RELATIONSHIPS = {
  // Horizontal relationships
  alignedRightOf: (spacingToken = 'sm') => ({ marginLeft: getSpacing(spacingToken), alignSelf: 'flex-start' }),
  alignedLeftOf: (spacingToken = 'sm') => ({ marginRight: getSpacing(spacingToken), alignSelf: 'flex-start' }),
  
  // Vertical relationships
  below: (spacingToken = 'md') => ({ marginTop: getSpacing(spacingToken) }),
  above: (spacingToken = 'md') => ({ marginBottom: getSpacing(spacingToken) }),
  
  // Stacked relationships
  stackedVertically: (spacingToken = 'sm') => ({ marginBottom: getSpacing(spacingToken) }),
  stackedHorizontally: (spacingToken = 'sm') => ({ marginRight: getSpacing(spacingToken) }),
  
  // Container relationships
  inside: (spacingToken = 'md') => ({ padding: getSpacing(spacingToken) }),
  around: (spacingToken = 'md') => ({ margin: getSpacing(spacingToken) }),
};

// Flexbox layout presets
export const FLEX_LAYOUTS = {
  // Row layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowSpaceAround: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rowStart: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  // Column layouts
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnStart: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  columnSpaceBetween: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  
  // Wrapped layouts
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  columnWrap: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
};

// Component boundary presets
export const COMPONENT_BOUNDARIES = {
  // Prevent overlapping and resizing
  fixed: {
    minWidth: 0,
    minHeight: 0,
    flexShrink: 0,
  },
  
  // Allow flexible sizing
  flexible: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  
  // Auto-size to content
  auto: {
    alignSelf: 'flex-start',
    minWidth: 0,
    minHeight: 0,
    flexShrink: 0,
  },
  
  // Full width
  fullWidth: {
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    flexShrink: 0,
  },
  
  // Full height
  fullHeight: {
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    flexShrink: 0,
  },
};

// Container grouping presets
export const CONTAINER_GROUPS = {
  header: {
    ...FLEX_LAYOUTS.rowSpaceBetween,
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    minHeight: scaleHeight(60),
  },
  
  cardList: {
    ...FLEX_LAYOUTS.column,
    padding: getSpacing('md'),
    gap: getSpacing('sm'),
  },
  
  cardItem: {
    ...FLEX_LAYOUTS.column,
    padding: getSpacing('md'),
    marginBottom: getSpacing('sm'),
    minHeight: scaleHeight(80),
  },
  
  footer: {
    ...FLEX_LAYOUTS.rowSpaceBetween,
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('md'),
    minHeight: scaleHeight(60),
  },
};

export default {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getResponsiveSpacing,
  getSpacing,
  widthPercentage,
  heightPercentage,
  getScreenDimensions,
  getCurrentBreakpoint,
  BREAKPOINTS,
  SPACING_TOKENS,
  BOUNDARY_RELATIONSHIPS,
  FLEX_LAYOUTS,
  COMPONENT_BOUNDARIES,
  CONTAINER_GROUPS,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};

