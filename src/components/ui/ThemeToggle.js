import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from './Icon';
import AnimatedButton from './AnimatedButton';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity) => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const ThemeToggle = ({ style }) => {
  const { theme, toggleTheme, themeMode, spacing } = useTheme();

  return (
    <AnimatedButton
      style={[
        {
          width: 45,
          height: 45,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        },
        style
      ]}
      onPress={toggleTheme}
    >
      <View
        style={{
          width: 45,
          height: 45,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: themeMode === 'dark' 
              ? hexToRgba(theme.colors.warning || '#FFB300', 0.15)
              : hexToRgba(theme.colors.secondary || '#7C3AED', 0.1),
            borderWidth: 1.5,
            borderColor: themeMode === 'dark'
              ? (theme.colors.warning || '#FFB300') + '50'
              : (theme.colors.secondary || '#7C3AED') + '40',
            padding: spacing.sm,
            borderRadius: 999, // Perfect circle
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: themeMode === 'dark'
              ? theme.colors.warning || '#FFB300'
              : theme.colors.secondary || '#7C3AED',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: themeMode === 'dark' ? 0.25 : 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Icon
            name={themeMode === 'dark' ? 'sunny' : 'moon'}
            library="ionicons"
            size={22}
            color={themeMode === 'dark' ? (theme.colors.warning || '#FFB300') : (theme.colors.secondary || '#7C3AED')}
            responsive={true}
            hitArea={false}
          />
        </View>
      </View>
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

