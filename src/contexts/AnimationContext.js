import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Keyboard, Platform, Dimensions, InteractionManager } from 'react-native';
import { 
  configureKeyboardAnimation,
  configureOrientationAnimation,
  configureSmoothLayoutAnimation,
  setReduceMotion,
  getReduceMotion,
  throttle,
} from '../utils/animations';

const AnimationContext = createContext(null);

/**
 * Provider for managing global animations and transitions
 */
export const AnimationProvider = ({ children, reduceMotion = false }) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const animationQueue = useRef([]);
  const isAnimating = useRef(false);

  // Set reduced motion preference
  useEffect(() => {
    setReduceMotion(reduceMotion);
  }, [reduceMotion]);

  // Keyboard event listeners with animations
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);

      // Disable animations for performance
      // configureKeyboardAnimation();

      // Delay input focus animation by 100ms - DISABLED for performance
      // setTimeout(() => {
      //   configureSmoothLayoutAnimation();
      // }, 100);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);

      // Disable animations for performance
      // configureKeyboardAnimation();
    });

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  // Orientation change listener
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      
      // Disable orientation animation for performance
      // configureOrientationAnimation();
    });

    return () => subscription?.remove();
  }, []);

  // Throttled layout animation for rapid changes
  const throttledLayoutAnimation = useRef(
    throttle(() => {
      if (!isAnimating.current) {
        isAnimating.current = true;
        InteractionManager.runAfterInteractions(() => {
          configureSmoothLayoutAnimation();
          isAnimating.current = false;
        });
      }
    }, 100)
  ).current;

  // Queue animation
  const queueAnimation = useCallback((animation, priority = 0) => {
    animationQueue.current.push({ animation, priority });
    animationQueue.current.sort((a, b) => b.priority - a.priority);
    
    if (!isAnimating.current) {
      processAnimationQueue();
    }
  }, []);

  // Process animation queue
  const processAnimationQueue = useCallback(() => {
    if (animationQueue.current.length === 0) {
      isAnimating.current = false;
      return;
    }

    isAnimating.current = true;
    const { animation } = animationQueue.current.shift();
    
    InteractionManager.runAfterInteractions(() => {
      try {
        animation();
        setTimeout(() => {
          processAnimationQueue();
        }, 50);
      } catch (error) {
        console.warn('Animation queue error:', error);
        isAnimating.current = false;
      }
    });
  }, []);

  const value = {
    isKeyboardVisible,
    keyboardHeight,
    dimensions,
    reduceMotion: getReduceMotion(),
    configureLayoutAnimation: throttledLayoutAnimation,
    queueAnimation,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    // Return no-op implementation if context is not available
    return {
      isKeyboardVisible: false,
      keyboardHeight: 0,
      dimensions: Dimensions.get('window'),
      reduceMotion: false,
      configureLayoutAnimation: () => {},
      queueAnimation: () => {},
    };
  }
  return context;
};

export default AnimationContext;

