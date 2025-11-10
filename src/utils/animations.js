import { LayoutAnimation, UIManager, Platform, Easing, Animated, InteractionManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Check if user has reduced motion enabled (accessibility)
let reduceMotionEnabled = false;
if (Platform.OS === 'ios') {
  // On iOS, we can check AccessibilityInfo
  // For now, we'll default to false and allow manual override
}

// Performance monitoring (dev mode only)
let isDevMode = __DEV__;
let frameTimings = [];
let lastFrameTime = Date.now();
let fps = 60;
let lowPerformanceMode = false;
let activeAnimations = 0;
const MAX_SIMULTANEOUS_ANIMATIONS = 3;

// FPS tracking disabled for performance - can be enabled manually if needed
// Track FPS - DISABLED for performance
// if (isDevMode) {
//   const trackFPS = () => {
//     const now = Date.now();
//     const delta = now - lastFrameTime;
//     lastFrameTime = now;
//     
//     if (delta > 0) {
//       const currentFPS = 1000 / delta;
//       frameTimings.push(currentFPS);
//       
//       // Keep only last 60 frames (1 second at 60fps)
//       if (frameTimings.length > 60) {
//         frameTimings.shift();
//       }
//       
//       // Calculate average FPS
//       if (frameTimings.length > 0) {
//         fps = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
//         
//         // Enable low performance mode if FPS drops below 45
//         if (fps < 45 && !lowPerformanceMode) {
//           lowPerformanceMode = true;
//           console.warn('[Animation] Low performance mode enabled (FPS:', fps.toFixed(1), ')');
//         } else if (fps >= 50 && lowPerformanceMode) {
//           lowPerformanceMode = false;
//           console.log('[Animation] Performance mode restored (FPS:', fps.toFixed(1), ')');
//         }
//       }
//     }
//     
//     requestAnimationFrame(trackFPS);
//   };
//   
//   requestAnimationFrame(trackFPS);
// }

/**
 * Centralized animation configuration
 * Optimized for 160-200ms durations for snappy mobile responsiveness
 */
export const ANIMATION_CONFIGS = {
  // Smooth ease configuration (reduced to 180ms)
  smoothEase: {
    duration: 180,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  },

  // Standard easing curve (reduced to 180ms)
  standard: {
    duration: 180,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
  },

  // Decelerate easing curve (reduced to 180ms)
  decelerate: {
    duration: 180,
    easing: Easing.bezier(0.0, 0.0, 0.2, 1),
  },

  // Accelerate easing curve (reduced to 180ms)
  accelerate: {
    duration: 180,
    easing: Easing.bezier(0.4, 0.0, 1, 1),
  },

  // Quick animation for immediate feedback (100ms for button tap)
  quick: {
    duration: 100,
    easing: Easing.out(Easing.quad),
  },

  // Fast animation for micro-interactions (160ms)
  fast: {
    duration: 160,
    easing: Easing.out(Easing.quad),
  },

  // Background fade (150ms)
  backgroundFade: {
    duration: 150,
    easing: Easing.out(Easing.quad),
  },
};

/**
 * Configure layout animation with smooth ease
 * Only triggers when layout actually changes (keyboard, orientation, etc.)
 */
export const configureSmoothLayoutAnimation = (config = ANIMATION_CONFIGS.smoothEase) => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    return; // Skip animation if reduced motion or low performance
  }

  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch (error) {
    console.warn('LayoutAnimation configuration failed:', error);
  }
};

/**
 * Configure layout animation for keyboard events
 */
export const configureKeyboardAnimation = () => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    return;
  }

  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch (error) {
    console.warn('Keyboard animation configuration failed:', error);
  }
};

/**
 * Configure layout animation for orientation changes
 * Throttled to once every 120ms to prevent over-triggering
 */
let lastOrientationAnimation = 0;
export const configureOrientationAnimation = () => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    return;
  }

  const now = Date.now();
  if (now - lastOrientationAnimation < 120) {
    return; // Throttle to 120ms
  }
  lastOrientationAnimation = now;

  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch (error) {
    console.warn('Orientation animation configuration failed:', error);
  }
};

/**
 * Animated timing with standard easing
 * Replaces spring animations for text, icons, and buttons to lower CPU overhead
 * Always uses native driver for transform and opacity
 */
export const animateTiming = (animatedValue, toValue, config = {}) => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    animatedValue.setValue(toValue);
    return { start: (callback) => callback?.({ finished: true }) };
  }

  // Limit simultaneous animations
  if (activeAnimations >= MAX_SIMULTANEOUS_ANIMATIONS) {
    animatedValue.setValue(toValue);
    return { start: (callback) => callback?.({ finished: true }) };
  }

  activeAnimations++;
  const animationConfig = {
    ...ANIMATION_CONFIGS.standard,
    ...config,
    useNativeDriver: config.useNativeDriver !== false,
  };

  const animation = Animated.timing(animatedValue, {
    toValue,
    ...animationConfig,
  });

  // Track animation completion
  const originalStart = animation.start.bind(animation);
  animation.start = (callback) => {
    return originalStart((finished) => {
      activeAnimations = Math.max(0, activeAnimations - 1);
      callback?.(finished);
    });
  };

  return animation;
};

/**
 * Animated spring for buttons and interactive elements
 * DEPRECATED: Use animateTiming instead for better performance
 * Kept for backward compatibility but should be replaced
 */
export const animateSpring = (animatedValue, toValue, config = {}) => {
  // Replace spring with timing for better performance
  return animateTiming(animatedValue, toValue, {
    ...config,
    duration: config.duration || 180,
    easing: Easing.out(Easing.quad),
  });
};

/**
 * Batch animations together using InteractionManager
 * Groups multiple layout updates to prevent jank
 */
export const batchAnimations = (animations, callback) => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    animations.forEach(anim => {
      if (anim.setValue && anim.toValue !== undefined) {
        anim.setValue(anim.toValue);
      }
    });
    callback?.();
    return;
  }

  // Limit batch size
  const limitedAnimations = animations.slice(0, MAX_SIMULTANEOUS_ANIMATIONS);

  InteractionManager.runAfterInteractions(() => {
    try {
      Animated.parallel(limitedAnimations).start((finished) => {
        if (finished) {
          callback?.();
        }
      });
    } catch (error) {
      console.warn('Batch animation error:', error);
      callback?.();
    }
  });
};

/**
 * Throttle function for layout recalculations
 * Updated to 120ms for layout animations
 */
export const throttle = (func, limit = 120) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function for rapid events
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Set reduced motion preference
 */
export const setReduceMotion = (enabled) => {
  reduceMotionEnabled = enabled;
};

/**
 * Get reduced motion preference
 */
export const getReduceMotion = () => {
  return reduceMotionEnabled;
};

/**
 * Safe animation wrapper that handles errors
 */
export const safeAnimate = (animation, onError) => {
  try {
    return animation.start((finished) => {
      if (!finished && onError) {
        onError();
      }
    });
  } catch (error) {
    console.warn('Animation error:', error);
    if (onError) {
      onError();
    }
  }
};

/**
 * Create animated value with initial value
 */
export const createAnimatedValue = (initialValue) => {
  return new Animated.Value(initialValue);
};

/**
 * Interpolate opacity for header compression
 */
export const interpolateHeaderOpacity = (animatedValue, keyboardHeight) => {
  return animatedValue.interpolate({
    inputRange: [0, keyboardHeight],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });
};

/**
 * Get current FPS (dev mode only)
 */
export const getFPS = () => {
  return isDevMode ? fps : 60;
};

/**
 * Check if low performance mode is active
 */
export const isLowPerformanceMode = () => {
  return lowPerformanceMode;
};

/**
 * Get active animation count
 */
export const getActiveAnimationCount = () => {
  return activeAnimations;
};

/**
 * Button tap feedback animation (scale down to 0.96 and back)
 */
export const animateButtonTap = (scaleValue, callback) => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    callback?.();
    return;
  }

  const animation = Animated.sequence([
    Animated.timing(scaleValue, {
      toValue: 0.96,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
  ]);

  animation.start(callback);
  return animation;
};

/**
 * Fade-in animation for new components (opacity 0.8 → 1)
 */
export const animateFadeIn = (opacityValue, callback) => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    opacityValue.setValue(1);
    callback?.();
    return { start: (cb) => cb?.({ finished: true }) };
  }

  opacityValue.setValue(0.8);
  return animateTiming(opacityValue, 1, {
    duration: 160,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start(callback);
};

/**
 * Slide animation for menu/tab changes (5px offset)
 */
export const animateSlide = (translateX, fromOffset = -5, callback) => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    translateX.setValue(0);
    callback?.();
    return { start: (cb) => cb?.({ finished: true }) };
  }

  translateX.setValue(fromOffset);
  return animateTiming(translateX, 0, {
    duration: 180,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start(callback);
};

/**
 * Background color fade animation (150ms)
 */
export const animateBackgroundFade = (animatedValue, toValue, callback) => {
  if (reduceMotionEnabled || lowPerformanceMode) {
    animatedValue.setValue(toValue);
    callback?.();
    return { start: (cb) => cb?.({ finished: true }) };
  }

  return animateTiming(animatedValue, toValue, {
    duration: 150,
    easing: Easing.out(Easing.quad),
    useNativeDriver: false, // backgroundColor can't use native driver
  }).start(callback);
};

/**
 * Cleanup routine to cancel ongoing animations
 */
export const cleanupAnimations = (animations) => {
  if (Array.isArray(animations)) {
    animations.forEach(anim => {
      if (anim && typeof anim.stop === 'function') {
        anim.stop();
      }
    });
  } else if (animations && typeof animations.stop === 'function') {
    animations.stop();
  }
  activeAnimations = Math.max(0, activeAnimations - 1);
};

export default {
  ANIMATION_CONFIGS,
  configureSmoothLayoutAnimation,
  configureKeyboardAnimation,
  configureOrientationAnimation,
  animateTiming,
  animateSpring,
  batchAnimations,
  throttle,
  debounce,
  setReduceMotion,
  getReduceMotion,
  safeAnimate,
  createAnimatedValue,
  interpolateHeaderOpacity,
  getFPS,
  isLowPerformanceMode,
  getActiveAnimationCount,
  animateButtonTap,
  animateFadeIn,
  animateSlide,
  animateBackgroundFade,
  cleanupAnimations,
};

