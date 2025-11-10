import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import { appConfig } from '../../config/appConfig';
import { alertService } from '../../services/alertService';
import { verifyPassword } from '../../utils/passwordHash';
import { 
  checkMaxAttempts, 
  incrementAttemptCounter, 
  resetAttemptCounter, 
  isLockedOut,
  setLockout,
  logSecurityEvent,
} from '../../utils/paymentSecurity';
import AnimatedButton from './AnimatedButton';
import Icon from './Icon';

const CashPaymentConfirmationModal = ({ visible, onClose, onConfirm, orderData, total }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState(null);
  const [attemptInfo, setAttemptInfo] = useState({ remainingAttempts: 5, locked: false });
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const passwordInputRef = useRef(null);

  // Load payment confirmation password from settings and check lockout
  useEffect(() => {
    if (visible) {
      loadPaymentPassword();
      checkLockoutStatus();
    } else {
      // Reset password when modal closes
      setPassword('');
    }
  }, [visible]);

  // Check lockout status
  const checkLockoutStatus = async () => {
    const lockout = await isLockedOut();
    if (lockout.locked) {
      setLockoutInfo({ remainingMinutes: lockout.remainingMinutes });
      setAttemptInfo({ locked: true, remainingAttempts: 0 });
    } else {
      const attempts = await checkMaxAttempts();
      setAttemptInfo(attempts);
      setLockoutInfo(null);
    }
  };

  const loadPaymentPassword = async () => {
    try {
      const settings = await firestoreService.getDocument('settings', 'payment');
      if (settings && settings.password) {
        setPaymentPassword(settings.password);
      } else {
        // Fallback to default password if not set
        setPaymentPassword(null);
      }
    } catch (error) {
      console.log('No payment password configured, using fallback');
      setPaymentPassword(null);
    }
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      alertService.error('Error', 'Please enter payment confirmation password');
      return;
    }

    // Check lockout status
    const lockout = await isLockedOut();
    if (lockout.locked) {
      alertService.error(
        'Account Locked', 
        `Too many failed attempts. Please try again in ${lockout.remainingMinutes} minute(s).`
      );
      setPassword('');
      return;
    }

    // Check max attempts
    const attempts = await checkMaxAttempts();
    if (attempts.maxAttemptsReached && attempts.locked) {
      alertService.error(
        'Account Locked', 
        `Too many failed attempts. Please try again in ${attempts.remainingMinutes} minute(s).`
      );
      setPassword('');
      await checkLockoutStatus();
      return;
    }

    setVerifying(true);
    const enteredPassword = password.trim();
    
    try {
      let isValid = false;

      // Check if payment password is configured
      if (paymentPassword) {
        // Verify against configured payment password (supports both hashed and plain text)
        isValid = verifyPassword(enteredPassword, paymentPassword);
      } else {
        // Fallback: Check against Firestore users with staff roles (backward compatibility)
        if (appConfig.USE_MOCKS) {
          // In mock mode, check against any active staff user
          const users = await firestoreService.getCollectionOnce('users', [
            ['status', '==', 'active']
          ]);
          isValid = users.some(user => {
            const isStaff = ['admin', 'cashier', 'kitchen', 'developer'].includes(user.role);
            if (!isStaff) return false;
            return verifyPassword(enteredPassword, user.password);
          });
        } else {
          // In production, check against Firestore users with staff roles
          const users = await firestoreService.getCollectionOnce('users', [
            ['status', '==', 'active']
          ]);

          // Check if password matches any active staff user (admin, cashier, kitchen, developer)
          isValid = users.some(user => {
            const isStaff = ['admin', 'cashier', 'kitchen', 'developer'].includes(user.role);
            if (!isStaff) return false;
            
            // Verify password (supports both hashed and plain text)
            // verifyPassword handles both cases automatically
            const passwordMatches = verifyPassword(enteredPassword, user.password);
            
            return passwordMatches;
          });
        }
      }

      if (isValid) {
        // Password verified - reset attempts and log success
        await resetAttemptCounter();
        await logSecurityEvent('payment_password_success', {
          orderId: orderData?.id,
          total,
        });
        
        // Password verified - place the order
        await onConfirm();
        setPassword('');
        onClose();
      } else {
        // Increment attempt counter
        const newAttemptCount = await incrementAttemptCounter();
        const remainingAttempts = 5 - newAttemptCount;
        
        // Log failed attempt (without password)
        await logSecurityEvent('payment_password_failure', {
          orderId: orderData?.id,
          attemptCount: newAttemptCount,
          remainingAttempts,
        });

        // Check if max attempts reached
        const maxAttemptsCheck = await checkMaxAttempts();
        if (maxAttemptsCheck.maxAttemptsReached) {
          // Set lockout if not already locked
          if (!maxAttemptsCheck.locked) {
            await setLockout();
          }
          const lockout = await isLockedOut();
          if (lockout.locked) {
            setLockoutInfo({ remainingMinutes: lockout.remainingMinutes });
            alertService.error(
              'Account Locked', 
              `Too many failed attempts. Please try again in ${lockout.remainingMinutes} minute(s).`
            );
          }
        } else {
          alertService.error(
            'Invalid Password', 
            `The password you entered is incorrect. ${remainingAttempts} attempt(s) remaining.`
          );
        }
        
        setPassword('');
        await checkLockoutStatus();
      }
    } catch (error) {
      // Log error (without password)
      await logSecurityEvent('payment_password_error', {
        orderId: orderData?.id,
        error: error.message,
      });
      
      // Never log password in error messages
      console.error('Password verification error:', error);
      alertService.error('Error', 'Failed to verify password. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: spacing.xl }]}>
        <View style={[
          styles.modalContent,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
          }
        ]}>
          {/* Header */}
          <View style={[styles.header, { marginBottom: spacing.lg }]}>
            <View style={[
              styles.iconContainer,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary + '40',
                borderRadius: borderRadius.xl,
                width: 80,
                height: 80,
                borderWidth: 3,
                marginBottom: spacing.md,
              }
            ]}>
              <Icon
                name="cash"
                library="ionicons"
                size={40}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[
              styles.title,
              {
                color: theme.colors.text,
                ...typography.h2,
                marginBottom: spacing.sm,
              }
            ]}>
              Cash Payment
            </Text>
            <Text style={[
              styles.subtitle,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
                textAlign: 'center',
              }
            ]}>
              Wait for the staff to confirm payment
            </Text>
          </View>

          {/* Order Summary */}
          <View style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
              borderWidth: 1.5,
            }
          ]}>
            <Text style={[
              styles.summaryLabel,
              {
                color: theme.colors.textSecondary,
                ...typography.caption,
                marginBottom: spacing.xs,
              }
            ]}>
              Order Total
            </Text>
            <Text style={[
              styles.summaryAmount,
              {
                color: theme.colors.primary,
                ...typography.h2,
              }
            ]}>
              ₱{total.toFixed(2)}
            </Text>
          </View>

          {/* Password Input */}
          <View style={[styles.passwordSection, { marginBottom: spacing.lg }]}>
            <Text style={[
              styles.passwordLabel,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
                marginBottom: spacing.sm,
              }
            ]}>
              Payment Confirmation Password
            </Text>
            {lockoutInfo && (
              <Text style={[
                styles.lockoutWarning,
                {
                  color: theme.colors.error,
                  ...typography.caption,
                  marginBottom: spacing.sm,
                }
              ]}>
                Account locked. Please try again in {lockoutInfo.remainingMinutes} minute(s).
              </Text>
            )}
            {!lockoutInfo && attemptInfo.remainingAttempts < 5 && (
              <Text style={[
                styles.attemptWarning,
                {
                  color: theme.colors.warning || theme.colors.primary,
                  ...typography.caption,
                  marginBottom: spacing.sm,
                }
              ]}>
                {attemptInfo.remainingAttempts} attempt(s) remaining
              </Text>
            )}
            <TextInput
              ref={passwordInputRef}
              style={[
                styles.passwordInput,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  ...typography.body,
                }
              ]}
              placeholder="Enter payment confirmation password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={(text) => {
                // Immediately mask the input - no delay
                setPassword(text);
              }}
              secureTextEntry={true}
              autoFocus={true}
              editable={!verifying && !attemptInfo.locked}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              textContentType="password"
              passwordRules="required: upper; required: lower; required: digit; minlength: 8;"
              keyboardType="default"
              returnKeyType="done"
              onSubmitEditing={handleVerifyPassword}
              accessibilityLabel="Payment confirmation password"
              accessibilityHint="Enter payment confirmation password"
              accessibilityRole="none"
              accessibilityState={{ disabled: verifying || attemptInfo.locked }}
              // Prevent copy/paste and ensure immediate masking
              onSelectionChange={() => {
                // Clear selection to prevent copy
                if (passwordInputRef.current) {
                  passwordInputRef.current.setNativeProps({ 
                    selection: { start: password.length, end: password.length },
                    secureTextEntry: true 
                  });
                }
              }}
              onFocus={() => {
                // Ensure secureTextEntry is always true on focus
                if (passwordInputRef.current) {
                  passwordInputRef.current.setNativeProps({ secureTextEntry: true });
                }
              }}
            />
          </View>

          {/* Action Buttons */}
          <View style={[styles.buttonRow, { gap: spacing.md }]}>
            <AnimatedButton
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  borderWidth: 1.5,
                  flex: 1,
                }
              ]}
              onPress={handleCancel}
              disabled={verifying}
            >
              <View style={[styles.cancelButtonContent, { gap: spacing.sm }]}>
                <Icon
                  name="close-circle"
                  library="ionicons"
                  size={20}
                  color={theme.colors.text}
                  responsive={true}
                  hitArea={false}
                />
                <Text style={[
                  styles.cancelButtonText,
                  {
                    color: theme.colors.text,
                    ...typography.button,
                  }
                ]}>
                  Cancel
                </Text>
              </View>
            </AnimatedButton>

            <AnimatedButton
              style={[
                styles.confirmButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  flex: 1,
                }
              ]}
              onPress={handleVerifyPassword}
              disabled={verifying || !password.trim() || attemptInfo.locked}
            >
              {verifying ? (
                <ActivityIndicator color={theme.colors.onPrimary} size="small" />
              ) : (
                <View style={[styles.confirmButtonContent, { gap: spacing.sm }]}>
                  <Icon
                    name="checkmark-circle"
                    library="ionicons"
                    size={20}
                    color={theme.colors.onPrimary}
                    responsive={true}
                    hitArea={false}
                  />
                  <Text style={[
                    styles.confirmButtonText,
                    {
                      color: theme.colors.onPrimary,
                      ...typography.button,
                    }
                  ]}>
                    Confirm
                  </Text>
                </View>
              )}
            </AnimatedButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding handled inline with theme spacing
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    // Typography handled via theme
  },
  summaryCard: {
    alignItems: 'center',
  },
  summaryLabel: {
    // Typography handled via theme
  },
  summaryAmount: {
    fontWeight: 'bold',
  },
  passwordSection: {
    // Margin handled inline
  },
  passwordLabel: {
    fontWeight: 'bold',
  },
  passwordInput: {
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    // Prevent text selection on Android
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'center',
    }),
  },
  lockoutWarning: {
    fontWeight: '600',
  },
  attemptWarning: {
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap handled inline with theme spacing
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap handled inline with theme spacing
  },
  confirmButtonText: {
    fontWeight: 'bold',
  },
});

export default CashPaymentConfirmationModal;


