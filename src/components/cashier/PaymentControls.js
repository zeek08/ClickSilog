import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../ui/Icon';
import AnimatedButton from '../ui/AnimatedButton';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'cash', color: '#10B981' },
  { id: 'gcash', label: 'GCash', icon: 'phone-portrait', color: '#0066FF' },
  { id: 'card', label: 'Card', icon: 'card', color: '#8B5CF6' },
];

const PaymentControls = ({ onPlaceOrder }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { total, items } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handlePaymentSelect = (methodId) => {
    setSelectedMethod(methodId);
    setShowPaymentModal(false);
    onPlaceOrder(methodId);
  };

  if (items.length === 0) return null;

  return (
    <>
      <View style={[
        styles.container,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 2,
          padding: spacing.md,
          paddingBottom: spacing.md + 20, // Safe area padding
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 4,
        }
      ]}>
        <AnimatedButton
          style={[
            styles.payButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.lg,
              shadowColor: theme.colors.primary,
            }
          ]}
          onPress={() => setShowPaymentModal(true)}
        >
          <Icon
            name="card"
            library="ionicons"
            size={24}
            color={theme.colors.onPrimary}
            style={{ marginRight: spacing.sm }}
          />
          <Text style={[
            styles.payButtonText,
            {
              color: theme.colors.onPrimary,
              ...typography.h4,
            }
          ]}>
            Process Payment
          </Text>
          <Text style={[
            styles.payButtonAmount,
            {
              color: theme.colors.onPrimary,
              ...typography.bodyBold,
              marginLeft: spacing.sm,
            }
          ]}>
            ₱{Number(total).toFixed(2)}
          </Text>
        </AnimatedButton>
      </View>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={[
          styles.modalOverlay,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        ]}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
            }
          ]}>
            <View style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.colors.border,
                padding: spacing.lg,
              }
            ]}>
              <Text style={[
                styles.modalTitle,
                {
                  color: theme.colors.text,
                  ...typography.h2,
                }
              ]}>
                Select Payment Method
              </Text>
              <AnimatedButton
                onPress={() => setShowPaymentModal(false)}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: theme.colors.errorLight,
                    borderRadius: borderRadius.round,
                    width: 36,
                    height: 36,
                  }
                ]}
              >
                <Icon
                  name="close"
                  library="ionicons"
                  size={20}
                  color={theme.colors.error}
                />
              </AnimatedButton>
            </View>

            <View style={[
              styles.methodsContainer,
              {
                padding: spacing.lg,
              }
            ]}>
              {PAYMENT_METHODS.map((method) => (
                <AnimatedButton
                  key={method.id}
                  style={[
                    styles.methodButton,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.border,
                      borderRadius: borderRadius.lg,
                      padding: spacing.lg,
                      marginBottom: spacing.md,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => handlePaymentSelect(method.id)}
                >
                  <View style={[
                    styles.methodIconContainer,
                    {
                      backgroundColor: method.color + '20',
                      borderRadius: borderRadius.round,
                      width: 56,
                      height: 56,
                    }
                  ]}>
                    <Icon
                      name={method.icon}
                      library="ionicons"
                      size={28}
                      color={method.color}
                    />
                  </View>
                  <Text style={[
                    styles.methodLabel,
                    {
                      color: theme.colors.text,
                      ...typography.h4,
                      marginTop: spacing.sm,
                    }
                  ]}>
                    {method.label}
                  </Text>
                </AnimatedButton>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styled inline
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonText: {
    // Typography handled via theme
  },
  payButtonAmount: {
    // Typography handled via theme
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '60%',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalTitle: {
    // Typography handled via theme
    flex: 1,
  },
  closeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodsContainer: {
    // Padding handled inline
  },
  methodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  methodIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodLabel: {
    // Typography handled via theme
  },
});

export default PaymentControls;

