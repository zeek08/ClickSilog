import React, { useContext } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import AnimatedButton from '../components/ui/AnimatedButton';
import Icon from '../components/ui/Icon';
import ThemeToggle from '../components/ui/ThemeToggle';

const DeveloperScreenSelection = () => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { setRole } = useContext(AuthContext);
  const navigation = useNavigation();

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back to login, just exit app
      BackHandler.exitApp();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const selectScreen = (role) => {
    setRole(role);
    // Navigation will be handled by AppNavigator based on user role
    // Reset to Home and let AppNavigator route to the correct stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }]
    });
  };

  const screenOptions = [
    {
      role: 'customer',
      label: 'Customer',
      icon: 'restaurant',
      color: theme.colors.primary,
      description: 'Menu & Ordering'
    },
    {
      role: 'cashier',
      label: 'Cashier',
      icon: 'cash',
      color: theme.colors.success,
      description: 'POS & Payments'
    },
    {
      role: 'kitchen',
      label: 'Kitchen',
      icon: 'restaurant-outline',
      color: theme.colors.warning,
      description: 'Order Display'
    },
    {
      role: 'admin',
      label: 'Admin',
      icon: 'settings',
      color: theme.colors.secondary,
      description: 'Management'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: spacing.xl + spacing.sm,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={[
              styles.iconBox,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: borderRadius.round,
                width: 48,
                height: 48,
                marginRight: spacing.sm,
              }
            ]}>
              <Icon
                name="code-working"
                library="ionicons"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[
                styles.headerTitle,
                {
                  color: theme.colors.text,
                  ...typography.h2,
                }
              ]}>
                Developer Mode
              </Text>
              <Text style={[
                styles.headerSubtitle,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                Select a screen to test
              </Text>
            </View>
          </View>
          <ThemeToggle />
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { padding: spacing.lg }]}>
        <View style={[styles.grid, { gap: spacing.md }]}>
          {screenOptions.map((option) => (
            <AnimatedButton
              key={option.role}
              onPress={() => selectScreen(option.role)}
              style={[
                styles.screenCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: borderRadius.xl,
                  padding: spacing.lg,
                  borderWidth: 1.5,
                }
              ]}
            >
              <View style={[
                styles.iconContainer,
                {
                  backgroundColor: option.color + '20',
                  borderRadius: borderRadius.round,
                  width: 64,
                  height: 64,
                  marginBottom: spacing.md,
                }
              ]}>
                <Icon
                  name={option.icon}
                  library="ionicons"
                  size={32}
                  color={option.color}
                />
              </View>
              <Text style={[
                styles.screenLabel,
                {
                  color: theme.colors.text,
                  ...typography.h3,
                  marginBottom: spacing.xs,
                }
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.screenDescription,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                {option.description}
              </Text>
            </AnimatedButton>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  screenCard: {
    width: '48%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenLabel: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  screenDescription: {
    textAlign: 'center',
  },
});

export default DeveloperScreenSelection;

