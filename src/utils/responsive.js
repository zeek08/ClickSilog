import { Dimensions, PixelRatio } from 'react-native';
import { moderateScale, moderateVerticalScale } from 'react-native-size-matters';

// Get dynamic screen dimensions
const getWindowDimensions = () => Dimensions.get('window');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getWindowDimensions();

// Base dimensions (iPhone 12 - 390x844) - Updated for modern smartphones
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Global responsive scaling helper
 * scale(size) = size * (SCREEN_WIDTH / 390)
 * @param {number} size - Base size in pixels
 * @returns {number} Responsive size
 */
export const scale = (size) => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleFactor));
};

/**
 * Get responsive width based on screen width (backward compatibility)
 * @param {number} size - Base size in pixels
 * @returns {number} Responsive size
 */
export const wp = (size) => scale(size);

/**
 * Get responsive height based on screen height (backward compatibility)
 * @param {number} size - Base size in pixels
 * @returns {number} Responsive size
 */
export const hp = (size) => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleFactor));
};

/**
 * Get responsive font size using moderateScale for better text scaling
 * @param {number} size - Base font size
 * @param {number} factor - Scaling factor (default: 0.3)
 * @returns {number} Responsive font size
 */
export const fp = (size, factor = 0.3) => {
  return moderateScale(size, factor);
};

/**
 * Get screen dimensions with modern device detection
 */
export const getScreenDimensions = () => {
  const dimensions = getWindowDimensions();
  const aspectRatio = dimensions.width / dimensions.height;
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio,
    isSmallDevice: dimensions.width < 380,
    isMediumDevice: dimensions.width >= 380 && dimensions.width < 430,
    isLargeDevice: dimensions.width >= 430,
    isTablet: dimensions.width >= 768,
    isUltraWide: aspectRatio > 2.0, // >20:9 aspect ratio
    isFoldable: aspectRatio > 2.3, // Foldable devices
    isCompact: dimensions.width < 370, // Small compact phones
  };
};

/**
 * Get responsive spacing multiplier
 * @param {number} baseSpacing - Base spacing value
 * @returns {number} Responsive spacing
 */
export const getResponsiveSpacing = (baseSpacing) => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.2); // Cap at 1.2x
  return baseSpacing * scale;
};

/**
 * Get percentage width
 * @param {number} percentage - Percentage of screen width (0-100)
 * @returns {number} Width in pixels
 */
export const widthPercentage = (percentage) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Get percentage height
 * @param {number} percentage - Percentage of screen height (0-100)
 * @returns {number} Height in pixels
 */
export const heightPercentage = (percentage) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Get responsive font tier based on screen width
 * @returns {string} Font tier ('small' | 'medium' | 'large')
 */
export const getFontTier = () => {
  const { width } = getScreenDimensions();
  if (width < 380) return 'small';
  if (width >= 380 && width <= 430) return 'medium';
  return 'large';
};

/**
 * Get responsive font size with tier-based scaling
 * @param {number} size - Base font size
 * @param {string} tier - Font tier override ('small' | 'medium' | 'large')
 * @returns {number} Responsive font size
 */
export const getResponsiveFontSize = (size, tier = null) => {
  const fontTier = tier || getFontTier();
  const tierMultipliers = {
    small: 0.95,
    medium: 1.0,
    large: 1.05,
  };
  const multiplier = tierMultipliers[fontTier] || 1.0;
  return fp(size * multiplier);
};

/**
 * Get responsive line height proportional to font size
 * @param {number} fontSize - Font size
 * @returns {number} Line height
 */
export const getResponsiveLineHeight = (fontSize) => {
  return Math.round(fontSize * 1.5);
};

/**
 * Get minimum icon hit area (44x44 for accessibility)
 * @param {number} iconSize - Icon size
 * @returns {number} Minimum hit area size
 */
export const getMinIconHitArea = (iconSize) => {
  const MIN_HIT_AREA = 44;
  return Math.max(iconSize, MIN_HIT_AREA);
};

/**
 * Get icon size with hit area padding
 * @param {number} iconSize - Icon size (already scaled if needed)
 * @param {boolean} shouldScale - Whether to scale the iconSize (default: true for backward compatibility)
 * @returns {object} Icon size and padding
 */
export const getIconWithHitArea = (iconSize, shouldScale = true) => {
  const finalSize = shouldScale ? scale(iconSize) : iconSize;
  const minHitArea = getMinIconHitArea(finalSize);
  const padding = (minHitArea - finalSize) / 2;
  
  return {
    size: finalSize,
    hitArea: minHitArea,
    padding: Math.max(0, padding),
  };
};

export default {
  scale,
  wp,
  hp,
  fp,
  getScreenDimensions,
  getResponsiveSpacing,
  widthPercentage,
  heightPercentage,
  getFontTier,
  getResponsiveFontSize,
  getResponsiveLineHeight,
  getMinIconHitArea,
  getIconWithHitArea,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};

