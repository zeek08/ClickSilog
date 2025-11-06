import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeContext', () => {
  it('should initialize with light theme by default', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.themeMode).toBe('light');
    expect(result.current.theme.colors.background).toBeDefined();
  });

  it('should toggle theme', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.themeMode).toBe('light');
    
    await act(async () => {
      await result.current.toggleTheme();
    });
    
    expect(result.current.themeMode).toBe('dark');
    
    await act(async () => {
      await result.current.toggleTheme();
    });
    
    expect(result.current.themeMode).toBe('light');
  });

  it('should provide spacing values', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.spacing).toBeDefined();
    expect(result.current.spacing.xs).toBeDefined();
    expect(result.current.spacing.sm).toBeDefined();
    expect(result.current.spacing.md).toBeDefined();
  });

  it('should provide borderRadius values', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.borderRadius).toBeDefined();
    expect(result.current.borderRadius.sm).toBeDefined();
    expect(result.current.borderRadius.md).toBeDefined();
    expect(result.current.borderRadius.lg).toBeDefined();
  });

  it('should provide typography values', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.typography).toBeDefined();
    expect(result.current.typography.h1).toBeDefined();
    expect(result.current.typography.body).toBeDefined();
    expect(result.current.typography.caption).toBeDefined();
  });
});

