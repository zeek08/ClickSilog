import { Platform } from 'react-native';

/**
 * Selective shadow utilities
 * Only apply shadows to critical interactive elements:
 * - Main action buttons
 * - Active modals
 * - Pop-up confirmations
 * 
 * Do NOT apply to:
 * - List items
 * - Cards
 * - Background containers
 */

/**
 * Light, soft shadow for critical interactive elements
 * shadowOpacity: 0.15, shadowRadius: 4, elevation: 3
 */
export const getCriticalShadow = (isDarkMode = false) => {
  if (Platform.OS === 'android') {
    return {
      elevation: 3,
      shadowColor: isDarkMode ? '#111' : '#000',
    };
  }

  return {
    shadowColor: isDarkMode ? '#111' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.1 : 0.15,
    shadowRadius: 4,
    elevation: 3,
  };
};

/**
 * Medium shadow for modals and popups
 */
export const getModalShadow = (isDarkMode = false) => {
  if (Platform.OS === 'android') {
    return {
      elevation: 8,
      shadowColor: isDarkMode ? '#111' : '#000',
    };
  }

  return {
    shadowColor: isDarkMode ? '#111' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.12 : 0.18,
    shadowRadius: 8,
    elevation: 8,
  };
};

/**
 * No shadow (for list items, cards, background containers)
 */
export const getNoShadow = () => {
  return {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  };
};

/**
 * Check if shadows should be rendered based on performance
 */
export const shouldRenderShadows = (fps, lowPerformanceMode) => {
  // Skip shadows if FPS drops below 50 or low performance mode
  if (lowPerformanceMode || fps < 50) {
    return false;
  }
  return true;
};

export default {
  getCriticalShadow,
  getModalShadow,
  getNoShadow,
  shouldRenderShadows,
};

