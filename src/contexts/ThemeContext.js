import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useColorScheme, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../config/theme';
import { createSafeTheme } from '../theme/utils';
import { animateTiming, createAnimatedValue, animateBackgroundFade } from '../utils/animations';

// Default context value to prevent undefined access
const defaultContextValue = {
  theme: lightTheme,
  toggleTheme: () => {},
  themeMode: 'light',
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  typography: lightTheme.typography,
};

const ThemeContext = createContext(defaultContextValue);

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemColorScheme || 'light');
  const [isReady, setIsReady] = useState(false);
  const backgroundColorAnim = useRef(createAnimatedValue(1)).current;
  const textColorAnim = useRef(createAnimatedValue(1)).current;

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsReady(true);
    }
  };

  const toggleTheme = useCallback(async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    
    // Animate theme transition with background fade (150ms)
    Animated.parallel([
      animateBackgroundFade(backgroundColorAnim, 0.5, () => {
        setThemeMode(newTheme);
      }),
      animateTiming(textColorAnim, 0.5, {
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Fade back in
      Animated.parallel([
        animateBackgroundFade(backgroundColorAnim, 1),
        animateTiming(textColorAnim, 1, {
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    });
    
    try {
      await AsyncStorage.setItem('themeMode', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [themeMode, backgroundColorAnim, textColorAnim]);

  const theme = useMemo(() => {
    return (themeMode === 'dark' ? darkTheme : lightTheme) || lightTheme;
  }, [themeMode]);

  const contextValue = useMemo(() => {
    // Ensure theme is always defined with safe fallbacks
    const currentTheme = createSafeTheme(theme || lightTheme);
    
    return {
      theme: currentTheme,
      toggleTheme,
      themeMode,
      spacing: currentTheme.spacing,
      borderRadius: currentTheme.borderRadius,
      typography: currentTheme.typography,
    };
  }, [theme, themeMode, toggleTheme]);

  // Always provide context value, even while loading theme preference
  // This prevents "useTheme must be used within ThemeProvider" errors
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Ensure context exists and has required properties
  if (!context || typeof context !== 'object') {
    console.warn('Theme context is invalid, using fallback');
    return defaultContextValue;
  }
  
  // Ensure spacing is always available, even if context is malformed
  if (!context.spacing || typeof context.spacing !== 'object') {
    console.warn('Theme context missing spacing, using fallback');
    return {
      ...context,
      theme: context.theme || lightTheme,
      spacing: lightTheme.spacing,
      borderRadius: context.borderRadius || lightTheme.borderRadius,
      typography: context.typography || lightTheme.typography,
    };
  }
  
  return context;
};

export default ThemeContext;
