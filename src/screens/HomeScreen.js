import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { widthPercentage, scale } from '../utils/responsive';
import { useResponsive } from '../hooks/useResponsive';
import ThemeToggle from '../components/ui/ThemeToggle';
import Icon from '../components/ui/Icon';
import AnimatedButton from '../components/ui/AnimatedButton';

const RoleButton = ({ label, iconName, color, onPress, theme, borderRadius, spacing, typography }) => {
  const iconColors = {
    customer: '#3B82F6',
    kitchen: '#EF4444',
    cashier: '#10B981',
    admin: '#8B5CF6',
  };
  
  const bgColors = {
    customer: theme.colors.infoLight || '#DBEAFE',
    kitchen: theme.colors.errorLight || '#FEE2E2',
    cashier: theme.colors.successLight || '#D1FAE5',
    admin: theme.colors.secondaryLight || '#E9D5FF',
  };

  const roleKey = label.toLowerCase();
  const iconColor = iconColors[roleKey] || theme.colors.primary;
  const bgColor = bgColors[roleKey] || theme.colors.primaryContainer;

  return (
    <AnimatedButton 
      style={[
        styles.roleBtn, 
        { 
          backgroundColor: bgColor,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          borderWidth: 0,
          width: '85%',
          minHeight: 90,
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.roleContent, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <View style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: borderRadius.round,
            width: 48,
            height: 48,
            marginRight: spacing.md,
          }
        ]}>
          <Icon
            name={iconName}
            library="ionicons"
            size={24}
            color={iconColor}
          />
        </View>
        <Text style={[
          styles.roleLabel,
          {
            color: theme.colors.text,
            ...typography.h4,
            fontWeight: '700',
            textAlign: 'center',
          }
        ]}>
          {label}
        </Text>
      </View>
    </AnimatedButton>
  );
};

const HomeScreen = () => {
  const { setRole } = useContext(AuthContext);
  const { theme, spacing, borderRadius, typography } = useTheme();
  const navigation = useNavigation();
  const { isTablet } = useResponsive();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const choose = (role) => {
    // Navigate immediately on single tap - don't wait for setRole
    // Navigation happens synchronously, setRole can happen in background
    if (role === 'customer') {
      navigation.navigate('TableNumber');
    } else {
      // For kitchen, cashier, and admin, go to login screen
      navigation.navigate('Login', { role });
    }
    
    // Set role in background (async, non-blocking)
    setRole(role);
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.background,
      }
    ]}>
      <View style={[styles.headerRight, { top: spacing.xl + spacing.sm, right: spacing.lg }]}>
        <ThemeToggle />
      </View>

      <View style={[
        styles.content,
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }
      ]}>
        {/* Logo Section - Centered */}
        <View style={[styles.logoSection, { marginBottom: spacing.xxl }]}>
          <View style={[
            styles.logoBox, 
            { 
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary + '40',
              shadowColor: theme.colors.primary,
              borderRadius: borderRadius.xl,
              width: scale(100),
              height: scale(100),
              borderWidth: 3,
            }
          ]}>
            <Icon
              name="restaurant"
              library="ionicons"
              size={scale(48)}
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

        {/* Station Buttons - Centered */}
        <View style={[
          styles.grid, 
          { 
            maxWidth: isTablet ? widthPercentage(60) : 350,
            width: '100%',
            gap: spacing.md,
            alignItems: 'center',
          }
        ]}>
          <RoleButton 
            label="Customer" 
            iconName="person" 
            onPress={() => choose('customer')} 
            theme={theme}
            borderRadius={borderRadius}
            spacing={spacing}
            typography={typography}
          />
          <RoleButton 
            label="Kitchen" 
            iconName="restaurant" 
            onPress={() => choose('kitchen')} 
            theme={theme}
            borderRadius={borderRadius}
            spacing={spacing}
            typography={typography}
          />
          <RoleButton 
            label="Cashier" 
            iconName="card" 
            onPress={() => choose('cashier')} 
            theme={theme}
            borderRadius={borderRadius}
            spacing={spacing}
            typography={typography}
          />
          <RoleButton 
            label="Admin" 
            iconName="settings" 
            onPress={() => choose('admin')} 
            theme={theme}
            borderRadius={borderRadius}
            spacing={spacing}
            typography={typography}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
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
  content: {
    // Centered via inline styles
  },
  grid: { 
    flexDirection: 'column',
  },
  roleBtn: { 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3,
  },
  roleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleLabel: { 
    textAlign: 'center',
  }
});

export default HomeScreen;
