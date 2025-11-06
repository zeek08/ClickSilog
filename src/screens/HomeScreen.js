import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import Icon from '../components/ui/Icon';
import AnimatedButton from '../components/ui/AnimatedButton';

const RoleButton = ({ label, color, iconName, onPress, theme, borderRadius, spacing }) => (
  <AnimatedButton 
    style={[
      styles.roleBtn, 
      { 
        backgroundColor: color, 
        shadowColor: color,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
      }
    ]} 
    onPress={onPress}
  >
    <View style={[
      styles.roleIconContainer,
      {
        width: 48,
        height: 48,
        borderRadius: borderRadius.round,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      }
    ]}>
      <Icon
        name={iconName}
        library="ionicons"
        size={24}
        color="#FFFFFF"
      />
    </View>
    <Text style={styles.roleLabel}>{label}</Text>
  </AnimatedButton>
);

const HomeScreen = () => {
  const { setRole } = useContext(AuthContext);
  const { theme, spacing, borderRadius, typography } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const choose = (role) => {
    // Check current route to prevent navigation loops
    const state = navigation.getState();
    const currentRoute = state?.routes[state?.index]?.name;
    
    setRole(role);
    
    // Navigate to Main screen (which will show the appropriate stack based on role)
    // Only navigate if we're not already on Main to prevent loops
    if (currentRoute !== 'Main') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }]
    });
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.background,
        padding: spacing.lg,
      }
    ]}>
      <View style={[styles.headerRight, { top: spacing.xl + spacing.sm, right: spacing.lg }]}>
        <ThemeToggle />
      </View>
      <View style={[styles.logoSection, { marginBottom: spacing.xxl }]}>
        <View style={[
          styles.logoBox, 
          { 
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary + '40',
            shadowColor: theme.colors.primary,
            borderRadius: borderRadius.xl,
            width: 120,
            height: 120,
            borderWidth: 3,
          }
        ]}>
          <Icon
            name="restaurant"
            library="ionicons"
            size={56}
            color={theme.colors.primary}
          />
        </View>
        <Text style={[
          styles.appName, 
          { 
            color: theme.colors.text,
            marginTop: spacing.lg,
            ...typography.h1,
          }
        ]}>
          ClickSiLog
        </Text>
        <Text style={[
          styles.subtitle, 
          { 
            color: theme.colors.textSecondary,
            marginTop: spacing.sm,
            ...typography.caption,
          }
        ]}>
          Select your station
        </Text>
      </View>

      <View style={[styles.grid, { gap: spacing.md }]}>
        <RoleButton 
          label="Customer" 
          color="#3B82F6" 
          iconName="cart" 
          onPress={() => choose('customer')} 
          theme={theme}
          borderRadius={borderRadius}
          spacing={spacing}
        />
        <RoleButton 
          label="Kitchen" 
          color="#EF4444" 
          iconName="restaurant" 
          onPress={() => choose('kitchen')} 
          theme={theme}
          borderRadius={borderRadius}
          spacing={spacing}
        />
        <RoleButton 
          label="Cashier" 
          color="#10B981" 
          iconName="card" 
          onPress={() => choose('cashier')} 
          theme={theme}
          borderRadius={borderRadius}
          spacing={spacing}
        />
        <RoleButton 
          label="Admin" 
          color="#8B5CF6" 
          iconName="settings" 
          onPress={() => choose('admin')} 
          theme={theme}
          borderRadius={borderRadius}
          spacing={spacing}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  headerRight: {
    position: 'absolute',
    zIndex: 10
  },
  logoSection: {
    alignItems: 'center',
  },
  logoBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 6, 
    elevation: 3 
  },
  appName: {
    // Typography handled via theme
  },
  subtitle: {
    // Typography handled via theme
  },
  grid: { 
    width: '100%', 
    maxWidth: 400
  },
  roleBtn: { 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 4, 
    elevation: 3 
  },
  roleIconContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleLabel: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 16, 
    letterSpacing: 0.5 
  }
});

export default HomeScreen;
