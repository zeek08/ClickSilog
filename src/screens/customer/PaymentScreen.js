import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { paymentService } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

const MethodChip = ({ label, selected, onPress, theme, borderRadius, spacing, typography }) => (
  <AnimatedButton
    style={[
      styles.methodChip, 
      { 
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 2.5,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 0.2 : 0.05,
        shadowRadius: 4,
        elevation: selected ? 4 : 2,
      }
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.methodText, 
      { 
        color: selected ? theme.colors.primary : theme.colors.text,
        ...typography.bodyBold,
      }
    ]}>
      {label}
    </Text>
  </AnimatedButton>
);

const PaymentScreen = ({ navigation }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { items, subtotal, total, discount, discountCode, discountAmount, applyDiscountCode, removeDiscount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('gcash');
  const [discountInput, setDiscountInput] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) {
      Alert.alert('Error', 'Please enter a discount code');
      return;
    }
    setApplyingDiscount(true);
    const result = await applyDiscountCode(discountInput.trim());
    if (result.success) {
      Alert.alert('Success', `Discount "${result.discount.name}" applied!`);
      setDiscountInput('');
    } else {
      Alert.alert('Error', result.error || 'Invalid discount code');
    }
    setApplyingDiscount(false);
  };

  const handlePay = async () => {
    if (items.length === 0) {
      Alert.alert('Cart is empty');
      return;
    }
    try {
      setLoading(true);
      const orderData = {
        items,
        subtotal,
        total,
        paymentMethod: method,
        status: 'pending',
        discountCode: discountCode || null,
        discountAmount: discountAmount || 0,
        discountName: discount?.name || null
      };
      if (method === 'gcash') {
        const payment = await paymentService.createPaymentIntent({
          amount: Math.round(total * 100),
          currency: 'PHP',
          description: 'ClickSiLog order'
        });
        if (payment.status !== 'paid') throw new Error('Payment failed');
        await orderService.placeOrder(orderData);
      } else {
        await orderService.placeOrder(orderData);
      }
      clearCart();
      Alert.alert('Order placed', 'Thank you! Your order is now in the queue.', [{ text: 'OK', onPress: () => navigation.popToTop() }]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Modern Header with Progress Indicator */}
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
        <View style={styles.stepper}>
          {/* Step 1: Cart */}
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              {
                backgroundColor: theme.colors.successLight,
                borderRadius: borderRadius.round,
                width: 32,
                height: 32,
                marginBottom: spacing.xs,
                borderWidth: 2,
                borderColor: theme.colors.success,
              }
            ]}>
              <Icon
                name="checkmark"
                library="ionicons"
                size={18}
                color={theme.colors.success}
              />
            </View>
            <Text style={[
              styles.stepLabel,
              {
                color: theme.colors.textSecondary,
                ...typography.caption,
              }
            ]}>
              Cart
            </Text>
          </View>
          
          {/* Connector */}
          <View style={[
            styles.stepConnector,
            {
              backgroundColor: theme.colors.primary,
              height: 2,
              flex: 1,
              marginTop: 15,
              marginHorizontal: spacing.xs,
            }
          ]} />
          
          {/* Step 2: Payment */}
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: borderRadius.round,
                width: 32,
                height: 32,
                marginBottom: spacing.xs,
                borderWidth: 2,
                borderColor: theme.colors.primary,
              }
            ]}>
              <Icon
                name="card"
                library="ionicons"
                size={18}
                color={theme.colors.onPrimary}
              />
            </View>
            <Text style={[
              styles.stepLabel,
              {
                color: theme.colors.primary,
                ...typography.captionBold,
              }
            ]}>
              Payment
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={[
        styles.content, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          borderWidth: 1.5,
        }
      ]}>
        <View style={[
          styles.iconBox, 
          { 
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary + '30',
            borderRadius: borderRadius.xl,
            width: 96,
            height: 96,
            borderWidth: 3,
            marginBottom: spacing.lg,
          }
        ]}>
          <Icon
            name="card"
            library="ionicons"
            size={48}
            color={theme.colors.primary}
          />
        </View>
        <Text style={[
          styles.subtitle, 
          { 
            color: theme.colors.textSecondary,
            ...typography.body,
            marginBottom: spacing.lg,
          }
        ]}>
          Select payment method and confirm your order
        </Text>

        <View style={[styles.methodsRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
          <MethodChip 
            label="GCash" 
            selected={method === 'gcash'} 
            onPress={() => setMethod('gcash')} 
            theme={theme}
            borderRadius={borderRadius}
            spacing={spacing}
            typography={typography}
          />
          <MethodChip 
            label="Cash" 
            selected={method === 'cash'} 
            onPress={() => setMethod('cash')} 
            theme={theme}
            borderRadius={borderRadius}
            spacing={spacing}
            typography={typography}
          />
        </View>

        {/* Discount Code Input */}
        <View style={[
          styles.discountSection,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }
        ]}>
          {discount ? (
            <View style={[styles.discountApplied, { gap: spacing.sm }]}>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.discountLabel,
                  {
                    color: theme.colors.text,
                    ...typography.bodyBold,
                    marginBottom: spacing.xs,
                  }
                ]}>
                  Discount Applied: {discount.name}
                </Text>
                <Text style={[
                  styles.discountCode,
                  {
                    color: theme.colors.primary,
                    ...typography.captionBold,
                  }
                ]}>
                  {discountCode} - {discount.type === 'percentage' ? `${discount.value}%` : `₱${discountAmount.toFixed(2)}`} off
                </Text>
              </View>
              <AnimatedButton
                onPress={removeDiscount}
                style={[
                  styles.removeDiscountBtn,
                  {
                    backgroundColor: theme.colors.errorLight,
                    borderRadius: borderRadius.round,
                    width: 32,
                    height: 32,
                  }
                ]}
              >
                <Icon
                  name="close"
                  library="ionicons"
                  size={18}
                  color={theme.colors.error}
                />
              </AnimatedButton>
            </View>
          ) : (
            <View style={styles.discountInput}>
              <TextInput
                value={discountInput}
                onChangeText={setDiscountInput}
                placeholder="Enter discount code"
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                  styles.discountInputField,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    borderWidth: 1.5,
                    flex: 1,
                    ...typography.body,
                    marginRight: spacing.sm,
                  }
                ]}
                autoCapitalize="characters"
              />
              <AnimatedButton
                onPress={handleApplyDiscount}
                disabled={applyingDiscount || !discountInput.trim()}
                style={[
                  styles.applyDiscountBtn,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    shadowColor: theme.colors.primary,
                  }
                ]}
              >
                {applyingDiscount ? (
                  <ActivityIndicator color={theme.colors.onPrimary} size="small" />
                ) : (
                  <Text style={[
                    styles.applyDiscountText,
                    {
                      color: theme.colors.onPrimary,
                      ...typography.bodyBold,
                    }
                  ]}>
                    Apply
                  </Text>
                )}
              </AnimatedButton>
            </View>
          )}
        </View>

        <View style={[styles.summary, { backgroundColor: theme.colors.borderLight }]}>
          <View style={styles.itemsList}>
            {items.map((item, idx) => (
              <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.itemLeft}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                  {item.addOns?.length > 0 && (
                    <Text style={[styles.itemAddOns, { color: theme.colors.textSecondary }]}>
                      {item.addOns.map((a) => a.name).join(', ')}
                    </Text>
                  )}
                  {item.specialInstructions && (
                    <View style={[styles.itemNotesContainer, { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }]}>
                      <Icon
                        name="document-text"
                        library="ionicons"
                        size={14}
                        color={theme.colors.warning}
                      />
                      <Text style={[
                        styles.itemNotes, 
                        { 
                          color: theme.colors.warning,
                          ...typography.caption,
                          fontStyle: 'italic',
                          flex: 1,
                        }
                      ]}>
                        {item.specialInstructions}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemQty, { color: theme.colors.textMuted }]}>x{item.qty}</Text>
                <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                  ₱{((item.totalItemPrice || item.price || 0) * item.qty).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₱{subtotal.toFixed(2)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.success }]}>
                Discount ({discountCode})
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                -₱{discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>₱{total.toFixed(2)}</Text>
          </View>
        </View>

        <AnimatedButton
          style={[
            styles.btn, 
            { 
              backgroundColor: theme.colors.primary,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.lg,
              shadowColor: theme.colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }, 
            loading && styles.btnDisabled
          ]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="small" />
          ) : (
            <>
              <Icon
                name="checkmark-circle"
                library="ionicons"
                size={22}
                color={theme.colors.onPrimary}
              />
              <View style={styles.btnContent}>
                <Text style={[
                  styles.btnText,
                  { 
                    color: theme.colors.onPrimary,
                    ...typography.bodyBold,
                  }
                ]}>
                  {method === 'cash' ? 'Place Order' : 'Pay with GCash'}
                </Text>
                <Text style={[
                  styles.btnSubtext,
                  { 
                    color: theme.colors.onPrimary,
                    ...typography.caption,
                    opacity: 0.95,
                  }
                ]}>
                  ₱{total.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </AnimatedButton>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  stepCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700'
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600'
  },
  stepConnector: {
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: { padding: 20, paddingBottom: 32 },
  content: { 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 6, 
    elevation: 2 
  },
  iconBox: { 
    width: 80, 
    height: 80, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    alignSelf: 'center', 
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  subtitle: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 24, 
    fontWeight: '500', 
    letterSpacing: 0.2 
  },
  methodsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 24 },
  methodChip: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, borderWidth: 2.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  methodText: { fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
  summary: { borderRadius: 18, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'transparent' },
  itemsList: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1.5 },
  itemLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  itemAddOns: { fontSize: 12, marginBottom: 3, fontWeight: '500' },
  itemNotes: { fontSize: 11, fontStyle: 'italic', fontWeight: '600' },
  itemQty: { fontSize: 13, marginRight: 12, marginTop: 2, fontWeight: '700' },
  itemPrice: { fontSize: 15, fontWeight: '800', minWidth: 80, textAlign: 'right', letterSpacing: 0.2 },
  divider: { height: 2, marginVertical: 16, borderRadius: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  summaryValue: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  totalRow: { paddingTop: 14, borderTopWidth: 2.5, marginTop: 8, marginBottom: 0 },
  totalLabel: { fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  totalValue: { fontSize: 24, fontWeight: '900', letterSpacing: 0.3 },
  btn: { 
    paddingVertical: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 4, 
    elevation: 3 
  },
  btnDisabled: { opacity: 0.6 },
  btnContent: {
    alignItems: 'center',
  },
  btnText: { 
    color: '#FFFFFF', 
    fontWeight: '900', 
    fontSize: 17, 
    letterSpacing: 0.5, 
    marginBottom: 4 
  },
  btnSubtext: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    opacity: 0.95, 
    fontWeight: '600' 
  },
  discountSection: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  discountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountInputField: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  applyDiscountBtn: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  applyDiscountText: {
    // Typography handled via theme
  },
  discountApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap handled inline via theme
  },
  discountLabel: {
    // Typography handled via theme
  },
  discountCode: {
    // Typography handled via theme
  },
  removeDiscountBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  }
});

export default PaymentScreen;
