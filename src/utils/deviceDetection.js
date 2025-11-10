import { Dimensions, PixelRatio } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// Cache device info
let deviceInfoCache = null;
let dimensionsCache = null;

/**
 * Get device information with caching
 */
export const getDeviceInfo = async () => {
  if (deviceInfoCache) {
    return deviceInfoCache;
  }

  try {
    const [brand, model, systemName, systemVersion] = await Promise.all([
      DeviceInfo.getBrand(),
      DeviceInfo.getModel(),
      DeviceInfo.getSystemName(),
      DeviceInfo.getSystemVersion(),
    ]);

    deviceInfoCache = {
      brand,
      model,
      systemName,
      systemVersion,
    };

    return deviceInfoCache;
  } catch (error) {
    console.warn('Error getting device info:', error);
    return {
      brand: 'Unknown',
      model: 'Unknown',
      systemName: 'Unknown',
      systemVersion: 'Unknown',
    };
  }
};

/**
 * Get screen dimensions with caching
 */
export const getCachedDimensions = () => {
  if (dimensionsCache) {
    return dimensionsCache;
  }

  const dimensions = Dimensions.get('window');
  const aspectRatio = dimensions.width / dimensions.height;
  
  dimensionsCache = {
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio,
    pixelRatio: PixelRatio.get(),
  };

  return dimensionsCache;
};

/**
 * Clear dimension cache (call on orientation change)
 */
export const clearDimensionCache = () => {
  dimensionsCache = null;
};

/**
 * Detect device type and characteristics
 */
export const detectDeviceType = () => {
  const dimensions = getCachedDimensions();
  const { width, height, aspectRatio } = dimensions;

  return {
    isSmallDevice: width < 380,
    isMediumDevice: width >= 380 && width < 430,
    isLargeDevice: width >= 430,
    isTablet: width >= 768,
    isUltraWide: aspectRatio > 2.0, // >20:9 aspect ratio
    isFoldable: aspectRatio > 2.3, // Foldable devices
    isCompact: width < 370, // Small compact phones
    aspectRatio,
    width,
    height,
  };
};

/**
 * Get device-specific layout adjustments
 */
export const getDeviceLayoutAdjustments = () => {
  const deviceType = detectDeviceType();
  const adjustments = {
    horizontalPadding: 1.0,
    verticalMargin: 1.0,
    fontScale: 1.0,
    buttonWidth: 'auto',
  };

  // Ultra-wide aspect ratio adjustments
  if (deviceType.isUltraWide) {
    adjustments.horizontalPadding = 0.9; // Reduce by 10%
    adjustments.verticalMargin = 1.05; // Increase by 5%
  }

  // Foldable adjustments
  if (deviceType.isFoldable) {
    adjustments.horizontalPadding = 0.95;
    adjustments.verticalMargin = 1.1;
  }

  // Compact phone adjustments
  if (deviceType.isCompact) {
    adjustments.fontScale = 0.95; // Reduce by 5%
    adjustments.buttonWidth = '100%'; // Full width buttons
  }

  return adjustments;
};

/**
 * Get brand-specific optimizations
 */
export const getBrandOptimizations = async () => {
  const deviceInfo = await getDeviceInfo();
  const brand = deviceInfo.brand?.toLowerCase() || '';
  
  const optimizations = {
    // Tecno, Realme, Honor, Samsung, Oppo, Infinix optimizations
    reduceAnimations: false,
    optimizeImages: false,
    adjustSpacing: false,
  };

  // Low-end device optimizations
  if (['tecno', 'infinix', 'realme'].includes(brand)) {
    optimizations.reduceAnimations = true;
    optimizations.optimizeImages = true;
  }

  // High-end device optimizations
  if (['samsung', 'oppo', 'honor'].includes(brand)) {
    optimizations.adjustSpacing = true;
  }

  return optimizations;
};

/**
 * Check if device supports high DPI
 */
export const isHighDPI = () => {
  const dimensions = getCachedDimensions();
  return dimensions.pixelRatio >= 2.5;
};

/**
 * Get recommended image resize mode based on device
 */
export const getRecommendedResizeMode = () => {
  const deviceType = detectDeviceType();
  
  if (deviceType.isUltraWide || deviceType.isFoldable) {
    return 'contain'; // Prevent distortion on wide screens
  }
  
  return 'cover'; // Default for standard screens
};

export default {
  getDeviceInfo,
  getCachedDimensions,
  clearDimensionCache,
  detectDeviceType,
  getDeviceLayoutAdjustments,
  getBrandOptimizations,
  isHighDPI,
  getRecommendedResizeMode,
};

