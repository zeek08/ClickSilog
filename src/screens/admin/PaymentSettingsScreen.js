import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import { hashPassword } from '../../utils/passwordHash';
import { alertService } from '../../services/alertService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

const PaymentSettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [paymentPassword, setPaymentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordExists, setPasswordExists] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(true);

  useEffect(() => {
    loadPaymentPassword();
  }, []);

  const loadPaymentPassword = async () => {
    setLoadingPassword(true);
    try {
      const settings = await firestoreService.getDocument('settings', 'payment');
      if (settings && settings.password) {
        // Password is set, but don't show the actual password for security
        setPasswordExists(true);
      } else {
        setPasswordExists(false);
      }
    } catch (error) {
      console.log('No payment password set yet');
      setPasswordExists(false);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!paymentPassword.trim()) {
      alertService.error('Error', 'Please enter a payment confirmation password.');
      return;
    }

    if (paymentPassword.trim().length < 4) {
      alertService.error('Error', 'Password must be at least 4 characters long.');
      return;
    }

    if (paymentPassword !== confirmPassword) {
      alertService.error('Error', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const hashedPassword = hashPassword(paymentPassword.trim());
      await firestoreService.upsertDocument('settings', 'payment', {
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      });

      alertService.success('Success', 'Payment confirmation password updated successfully.');
      setPaymentPassword('');
      setConfirmPassword('');
      setPasswordExists(true);
      // Reload to confirm it was saved
      await loadPaymentPassword();
    } catch (error) {
      console.error('Save payment password error:', error);
      alertService.error('Error', 'Failed to save payment password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <AnimatedButton
              onPress={() => navigation.goBack()}
              style={[
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  borderRadius: borderRadius.round,
                  width: 44,
                  height: 44,
                  borderWidth: 1.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.sm,
                }
              ]}
            >
              <Icon
                name="arrow-back"
                library="ionicons"
                size={22}
                color={theme.colors.text}
              />
            </AnimatedButton>
            <Icon
              name="lock-closed"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[
              styles.headerTitle,
              { color: theme.colors.text, ...typography.h2 }
            ]}>
              Payment Settings
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          {
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.infoCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            borderWidth: 1,
          }
        ]}>
          <Icon
            name="information-circle"
            library="ionicons"
            size={24}
            color={theme.colors.info || theme.colors.primary}
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={[
            styles.infoTitle,
            {
              color: theme.colors.text,
              ...typography.h4,
              marginBottom: spacing.sm,
            }
          ]}>
            Payment Confirmation Password
          </Text>
          <Text style={[
            styles.infoText,
            {
              color: theme.colors.textSecondary,
              ...typography.body,
              marginBottom: spacing.xs,
            }
          ]}>
            Set a password that staff must enter to confirm cash payments. This password is separate from user account passwords.
          </Text>
          {loadingPassword ? (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                Checking password status...
              </Text>
            </View>
          ) : passwordExists ? (
            <View style={[
              {
                backgroundColor: theme.colors.successLight + '20',
                borderColor: theme.colors.success,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                marginTop: spacing.sm,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }
            ]}>
              <Icon
                name="checkmark-circle"
                library="ionicons"
                size={18}
                color={theme.colors.success}
              />
              <Text style={[
                {
                  color: theme.colors.success,
                  ...typography.caption,
                  fontWeight: '600',
                }
              ]}>
                Password is configured. Enter a new password below to change it.
              </Text>
            </View>
          ) : (
            <View style={[
              {
                backgroundColor: theme.colors.warningLight + '20',
                borderColor: theme.colors.warning,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                marginTop: spacing.sm,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }
            ]}>
              <Icon
                name="warning"
                library="ionicons"
                size={18}
                color={theme.colors.warning}
              />
              <Text style={[
                {
                  color: theme.colors.warning,
                  ...typography.caption,
                  fontWeight: '600',
                }
              ]}>
                No password configured. Please set a password below.
              </Text>
            </View>
          )}
        </View>

        <View style={[
          styles.formCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            borderWidth: 1,
          }
        ]}>
          <View style={{ marginBottom: spacing.md }}>
            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                ...typography.caption,
                marginBottom: spacing.sm,
              }
            ]}>
              New Password
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    borderRadius: borderRadius.md,
                    borderWidth: 1.5,
                    padding: spacing.sm,
                    paddingRight: 50,
                    ...typography.body,
                  }
                ]}
                placeholder="Enter new password"
                placeholderTextColor={theme.colors.textSecondary}
                value={paymentPassword}
                onChangeText={setPaymentPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <AnimatedButton
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: spacing.sm,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: spacing.xs,
                }}
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  library="ionicons"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </AnimatedButton>
            </View>
          </View>

          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                ...typography.caption,
                marginBottom: spacing.sm,
              }
            ]}>
              Confirm Password
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    borderRadius: borderRadius.md,
                    borderWidth: 1.5,
                    padding: spacing.sm,
                    paddingRight: 50,
                    ...typography.body,
                  }
                ]}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <AnimatedButton
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: spacing.sm,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: spacing.xs,
                }}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  library="ionicons"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </AnimatedButton>
            </View>
          </View>

          <AnimatedButton
            style={[
              styles.saveButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
              }
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={[
              styles.saveButtonText,
              {
                color: theme.colors.onPrimary,
                ...typography.button,
              }
            ]}>
              {loading ? 'Saving...' : 'Save Password'}
            </Text>
          </AnimatedButton>
        </View>
      </ScrollView>
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
    shadowRadius: 4,
    elevation: 2,
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
  headerTitle: {
    fontWeight: '700',
  },
  content: {
    flexGrow: 1,
  },
  infoCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontWeight: '700',
  },
  infoText: {
    lineHeight: 20,
  },
  formCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
  },
  saveButton: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    textAlign: 'center',
  },
});

export default PaymentSettingsScreen;

