import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, Easing, Platform, Keyboard, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KeyboardFocusContext = createContext(null);

/**
 * Provider for managing TextInput focus and scroll-to-focus behavior
 */
export const KeyboardFocusProvider = ({ children }) => {
  const insets = useSafeAreaInsets();
  const scrollRefs = useRef(new Map()); // Map of screenName -> scrollRef
  const inputRefs = useRef(new Map()); // Map of inputId -> { ref, screenName, yPosition }
  const [activeInput, setActiveInput] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const animationQueue = useRef([]);
  const isAnimating = useRef(false);
  const debounceTimeout = useRef(null);

  const { height: screenHeight } = Dimensions.get('window');

  // Register a scroll container for a screen
  const registerScrollRef = useCallback((screenName, scrollRef) => {
    if (scrollRef) {
      scrollRefs.current.set(screenName, scrollRef);
    } else {
      scrollRefs.current.delete(screenName);
    }
  }, []);

  // Register a TextInput for focus tracking
  const registerInput = useCallback((inputId, inputRef, screenName) => {
    if (inputRef) {
      inputRefs.current.set(inputId, { ref: inputRef, screenName, yPosition: 0 });
    } else {
      inputRefs.current.delete(inputId);
    }
  }, []);

  // Unregister an input
  const unregisterInput = useCallback((inputId) => {
    inputRefs.current.delete(inputId);
    if (activeInput === inputId) {
      setActiveInput(null);
    }
  }, [activeInput]);

  // Measure input position and scroll to it
  const scrollToInput = useCallback((inputId, options = {}) => {
    const {
      duration = 250,
      easing = Easing.bezier(0.4, 0.0, 0.2, 1), // ease-in-out cubic
      offset = 0,
      skipIfVisible = true,
    } = options;

    // Debounce rapid focus events
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const inputData = inputRefs.current.get(inputId);
      if (!inputData) return;

      const { ref, screenName } = inputData;
      const scrollRef = scrollRefs.current.get(screenName);
      
      if (!ref || !scrollRef) return;

      try {
        // Measure input position
        ref.measureInWindow((x, y, width, height) => {
          if (!y && y !== 0) return; // Invalid measurement

          const inputCenterY = y + height / 2;
          const keyboardTop = screenHeight - keyboardHeight;
          const visibleAreaHeight = keyboardTop - insets.top;
          const targetY = visibleAreaHeight / 2 + insets.top;

          // Check if input is already visible
          if (skipIfVisible) {
            const inputTop = y;
            const inputBottom = y + height;
            const visibleTop = insets.top;
            const visibleBottom = keyboardTop - 20; // 20px buffer

            if (inputTop >= visibleTop && inputBottom <= visibleBottom) {
              // Input is already visible, skip scroll
              return;
            }
          }

          // Calculate scroll offset
          const scrollOffset = inputCenterY - targetY + offset;

          // Get the actual scrollable node
          const scrollableNode = 
            scrollRef.getScrollResponder?.()?.getScrollableNode?.() ||
            scrollRef._component?.getScrollableNode?.() ||
            scrollRef._scrollView ||
            scrollRef;

          // Animate scroll
          // For KeyboardAwareScrollView, use scrollToPosition
          if (scrollRef.scrollToPosition) {
            // KeyboardAwareScrollView API
            scrollRef.scrollToPosition(0, Math.max(0, scrollOffset), true);
          } else if (scrollRef.scrollTo) {
            // For ScrollView
            scrollRef.scrollTo({
              y: Math.max(0, scrollOffset),
              animated: true,
            });
          } else if (scrollRef.scrollToOffset) {
            // For FlatList
            scrollRef.scrollToOffset({
              offset: Math.max(0, scrollOffset),
              animated: true,
            });
          } else if (scrollableNode && scrollableNode.scrollTo) {
            // Fallback: direct scrollable node
            scrollableNode.scrollTo({
              y: Math.max(0, scrollOffset),
              animated: true,
            });
          }

          setActiveInput(inputId);
        });
      } catch (error) {
        console.warn('KeyboardFocusContext: Error scrolling to input', error);
      }
    }, 100); // 100ms debounce
  }, [keyboardHeight, screenHeight, insets.top]);

  // Reset scroll position with smooth animation
  const resetScroll = useCallback((screenName, animated = true) => {
    const scrollRef = scrollRefs.current.get(screenName);
    if (!scrollRef) return;

    if (animated) {
      // Use Animated.timing for smooth reset
      Animated.timing(new Animated.Value(0), {
        toValue: 0,
        duration: 250,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // ease-in-out cubic
        useNativeDriver: false,
      }).start(() => {
        // After animation completes, reset scroll
        if (scrollRef.scrollToPosition) {
          // KeyboardAwareScrollView API
          scrollRef.scrollToPosition(0, 0, true);
        } else if (scrollRef.scrollTo) {
          scrollRef.scrollTo({
            y: 0,
            animated: false,
          });
        } else if (scrollRef.scrollToOffset) {
          scrollRef.scrollToOffset({
            offset: 0,
            animated: false,
          });
        }
      });
    } else {
      // Immediate reset
      if (scrollRef.scrollToPosition) {
        scrollRef.scrollToPosition(0, 0, false);
      } else if (scrollRef.scrollTo) {
        scrollRef.scrollTo({
          y: 0,
          animated: false,
        });
      } else if (scrollRef.scrollToOffset) {
        scrollRef.scrollToOffset({
          offset: 0,
          animated: false,
        });
      }
    }

    setActiveInput(null);
  }, []);

  // Keyboard event listeners
  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height || 0;
      setKeyboardHeight(height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      
      // Reset scroll position when keyboard hides (smooth animation)
      // Reset all registered screens' scroll positions
      const currentActiveInput = activeInput;
      if (currentActiveInput) {
        scrollRefs.current.forEach((scrollRef, screenName) => {
          if (scrollRef) {
            // Only reset if there was an active input
            resetScroll(screenName, true);
          }
        });
      }
      
      setActiveInput(null);
    });

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const value = {
    registerScrollRef,
    registerInput,
    unregisterInput,
    scrollToInput,
    resetScroll,
    activeInput,
    keyboardHeight,
  };

  return (
    <KeyboardFocusContext.Provider value={value}>
      {children}
    </KeyboardFocusContext.Provider>
  );
};

export const useKeyboardFocus = () => {
  const context = useContext(KeyboardFocusContext);
  if (!context) {
    // Return no-op implementation if context is not available
    return {
      registerScrollRef: () => {},
      registerInput: () => {},
      unregisterInput: () => {},
      scrollToInput: () => {},
      resetScroll: () => {},
      activeInput: null,
      keyboardHeight: 0,
    };
  }
  return context;
};

export default KeyboardFocusContext;

