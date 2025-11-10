import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { alertService } from '../services/alertService';
import AnimatedButton from '../components/ui/AnimatedButton';
import Icon from '../components/ui/Icon';
import ThemeToggle from '../components/ui/ThemeToggle';

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

const TableNumberScreen = () => {
  const insets = useSafeAreaInsets();
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleLogin = async () => {
    const tableNum = tableNumber.trim();
    if (!tableNum) {
      alertService.error('Error', 'Please enter a table number');
      return;
    }

    const num = parseInt(tableNum, 10);
    if (isNaN(num) || num < 1) {
      alertService.error('Error', 'Please enter a valid table number');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.loginWithTableNumber(num);
      await login(user);
      
             // Navigation will be handled by AppNavigator based on user role
             // No need to navigate manually - AppNavigator will route correctly
    } catch (error) {
      alertService.error('Invalid Table', error.message || 'Table number not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 100 })}
    >
      {/* Header bar with Home and Theme buttons */}
      <View style={[
        styles.headerBar,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1.5,
              paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.lg,
        }
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AnimatedButton
            onPress={() => navigation.navigate('Home')}
            style={{
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: hexToRgba(theme.colors.info || '#3B82F6', 0.1),
                  borderWidth: 1.5,
                  borderColor: (theme.colors.info || '#3B82F6') + '40',
                  padding: spacing.sm,
                  borderRadius: 999,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.info || '#3B82F6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Icon
                  name="home"
                  library="ionicons"
                  size={22}
                  color={theme.colors.info || '#3B82F6'}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </View>
          </AnimatedButton>
          <ThemeToggle />
        </View>
      </View>

      <View style={[styles.content, { padding: spacing.xl }]}>
        <View style={[styles.logoContainer, { marginBottom: spacing.xxl }]}>
          <View style={[
            styles.logoBox,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: borderRadius.xl,
              borderColor: theme.colors.primary + '40',
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
          <Text style={[styles.title, { color: theme.colors.text, ...typography.h1, marginTop: spacing.lg }]}>
            Welcome to ClickSiLog
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, ...typography.body, marginTop: spacing.sm }]}>
            Enter your table number to start ordering
          </Text>
        </View>

        <View style={[styles.form, { gap: spacing.lg }]}>
          <View>
            <Text style={[styles.label, { color: theme.colors.text, ...typography.caption }]}>
              Table Number
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  ...typography.h2,
                  textAlign: 'center',
                }
              ]}
              placeholder="Enter table number"
              placeholderTextColor={theme.colors.textSecondary}
              value={tableNumber}
              onChangeText={(text) => {
                // Only allow numbers
                const numeric = text.replace(/[^0-9]/g, '');
                setTableNumber(numeric);
              }}
              keyboardType="number-pad"
              maxLength={3}
              editable={!loading}
              onSubmitEditing={handleLogin}
              autoFocus
            />
          </View>

          <AnimatedButton
            style={[
              styles.loginButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                opacity: loading ? 0.6 : 1,
              }
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.loginButtonText, { ...typography.button }]}>
                Start Ordering
              </Text>
            )}
          </AnimatedButton>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBox: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    minHeight: 64,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
  staffButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffButtonText: {
    fontWeight: '600',
  },
});

export default TableNumberScreen;

