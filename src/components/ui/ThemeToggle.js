import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from './Icon';
import AnimatedButton from './AnimatedButton';

const ThemeToggle = ({ style }) => {
  const { theme, toggleTheme, themeMode, borderRadius } = useTheme();

  return (
    <AnimatedButton
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: theme.colors.border,
          borderRadius: borderRadius.round,
          width: 44,
          height: 44,
        }, 
        style
      ]}
      onPress={toggleTheme}
    >
      <Icon
        name={themeMode === 'dark' ? 'sunny' : 'moon'}
        library="ionicons"
        size={22}
        color={theme.colors.primary}
      />
    </AnimatedButton>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  }
});

export default ThemeToggle;

