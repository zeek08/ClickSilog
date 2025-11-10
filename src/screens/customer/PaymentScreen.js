import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { alertService } from '../../services/alertService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';
import CashPaymentConfirmationModal from '../../components/ui/CashPaymentConfirmationModal';
import PaymentErrorBoundary from '../../components/ui/PaymentErrorBoundary';

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
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { user } = useContext(AuthContext);
  const { items, subtotal, total, discount, discountCode, discountAmount, applyDiscountCode, removeDiscount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('gcash');
  const [discountInput, setDiscountInput] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [showCashConfirmation, setShowCashConfirmation] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) {
      alertService.error('Invalid Code', 'Please enter a discount code.');
      return;
    }
    setApplyingDiscount(true);
    const result = await applyDiscountCode(discountInput.trim());
    if (result.success) {
      setDiscountInput('');
    } else {
      // Show error popup when discount code is invalid or doesn't exist
      alertService.error('Invalid Discount Code', result.error || 'The discount code you entered does not exist or is no longer valid. Please check and try again.');
    }
    setApplyingDiscount(false);
  };

  // Order status monitoring is handled by CustomerOrderNotification component

  const handlePay = async () => {
    if (items.length === 0) {
      return;
    }

    // For cash payments, show confirmation modal
    if (method === 'cash') {
      setShowCashConfirmation(true);
      return;
    }

    // For GCash, proceed with payment
    await processGCashPayment();
  };

  const processGCashPayment = async () => {
    try {
      setLoading(true);
      
      // Step 1: Create order first to get orderId with pending_payment status
      const orderData = {
        items,
        subtotal,
        total,
        paymentMethod: 'gcash',
        status: 'pending_payment', // Critical: order is waiting for payment
        discountCode: discountCode || null,
        discountAmount: discountAmount || 0,
        discountName: discount?.name || null,
        tableNumber: user?.tableNumber || null,
        userId: user?.uid || null,
        source: 'customer', // Mark order as created by customer
        paymentStatus: 'pending', // Payment is pending
      };
      
      // Place order first to get orderId
      const orderResult = await orderService.placeOrder(orderData);
      const orderId = orderResult?.id || orderResult?.orderId || `order_${Date.now()}`;
      
      // Step 2: Create payment source via Cloud Function (QR PH API)
      // This will return either QR code data or checkout URL depending on PayMongo response
      const paymentResult = await paymentService.processPayment({
        amount: total,
        currency: 'PHP',
        description: `ClickSiLog Order #${orderId}`,
        orderId,
        paymentMethod: 'gcash',
        tableNumber: user?.tableNumber || null
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
      
      // Step 3: Update order with source info (already done by Cloud Function, but ensure consistency)
      if (paymentResult.sourceId) {
        await orderService.updateOrder(orderId, {
          sourceId: paymentResult.sourceId,
          paymentStatus: 'pending',
          status: 'pending_payment'
        });
      }
      
      // Step 4: Navigate to GCash payment screen with QR code or checkout URL
      // The screen will automatically show QR code if available, or checkout button if that's what PayMongo returned
      navigation.navigate('GCashPayment', {
        orderId,
        sourceId: paymentResult.sourceId,
        checkoutSessionId: paymentResult.checkoutSessionId,
        checkoutUrl: paymentResult.checkoutUrl,
        qrData: paymentResult.qrData,
        expiresAt: paymentResult.expiresAt,
        amount: total,
        paymentType: paymentResult.qrData ? 'qrph' : 'checkout' // Auto-detect based on what PayMongo returned
      });
      
      // Don't clear cart yet - wait for payment confirmation
    } catch (e) {
      console.error('Payment error:', e.message);
      alertService.error('Payment Error', e.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processCashPayment = async () => {
    try {
      setLoading(true);
      const orderData = {
        items,
        subtotal,
        total,
        paymentMethod: 'cash',
        status: 'pending',
        discountCode: discountCode || null,
        discountAmount: discountAmount || 0,
        discountName: discount?.name || null
      };
      await orderService.placeOrder({
        ...orderData,
        tableNumber: user?.tableNumber || null,
        userId: user?.uid || null,
        source: 'customer', // Mark order as created by customer
      });
      clearCart();
      // Navigation handled by CustomerOrderNotification component
      navigation.popToTop();
    } catch (e) {
      console.error('Payment error:', e.message);
      // Error will be shown by CustomerOrderNotification or handled gracefully
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Payment screen error:', error, errorInfo);
      }}
      onRetry={processGCashPayment}
    >
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 100 })}
    >
      {/* Modern Header with Progress Indicator */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
        }
      ]}>
        <View style={[styles.headerTop, { marginBottom: spacing.md }]}>
          <ThemeToggle />
          
          {/* Compact Cart > Payment Stepper */}
          <View style={[styles.stepper, { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }]}>
          {/* Step 1: Cart */}
            <View style={[
              styles.stepCircle,
              {
                backgroundColor: theme.colors.successLight,
                borderRadius: borderRadius.round,
                width: 44,
                height: 44,
                borderWidth: 1.5,
                borderColor: theme.colors.success,
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}>
              <Icon
                name="checkmark"
                library="ionicons"
                size={22}
                color={theme.colors.success}
                responsive={true}
                hitArea={false}
              />
          </View>
          
          {/* Connector */}
          <View style={[
            {
              backgroundColor: theme.colors.primary,
              height: 2,
                width: 32,
            }
          ]} />
          
          {/* Step 2: Payment */}
            <View style={[
              styles.stepCircle,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: borderRadius.round,
                width: 44,
                height: 44,
                borderWidth: 1.5,
                borderColor: theme.colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}>
              <Icon
                name="card"
                library="ionicons"
                size={22}
                color={theme.colors.onPrimary}
                responsive={true}
                hitArea={false}
              />
            </View>
          </View>
          
          <AnimatedButton
            onPress={() => navigation.goBack()}
            style={[
              {
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }
            ]}
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
                  backgroundColor: theme.colors.error + '20',
                  borderWidth: 1.5,
                  borderColor: theme.colors.error,
                  padding: spacing.sm,
                  borderRadius: 999, // Perfect circle
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.error,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Icon
                  name="close"
                  library="ionicons"
                  size={22}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </View>
          </AnimatedButton>
        </View>
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid={true}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.contentContainer, { padding: spacing.xl, paddingBottom: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
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
            name={method === 'gcash' ? 'phone-portrait' : 'cash'}
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
          Select payment method
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
            marginBottom: spacing.md,
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
                    padding: spacing.sm,
                    borderWidth: 1.5,
                    flex: 1,
                    ...typography.body,
                    marginRight: spacing.sm,
                    textAlignVertical: 'center',
                    paddingVertical: spacing.sm,
                    includeFontPadding: false,
                    fontSize: 14,
                  }
                ]}
                autoCapitalize="characters"
                textAlignVertical="center"
              />
              <AnimatedButton
                onPress={handleApplyDiscount}
                disabled={applyingDiscount || !discountInput.trim()}
                style={[
                  styles.applyDiscountBtn,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
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

        <View style={[styles.summary, { backgroundColor: theme.colors.borderLight, padding: spacing.xl, marginBottom: spacing.lg }]}>
          <View style={styles.itemsList}>
            {items.map((item, idx) => (
              <View key={`cart-item-${item.id || item.name || idx}-${idx}`} style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}>
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
              paddingVertical: spacing.md,
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
                <Text 
                  style={[
                    styles.btnText,
                    { 
                      color: theme.colors.onPrimary,
                      ...typography.bodyBold,
                    }
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                  allowFontScaling={true}
                >
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
    </KeyboardAwareScrollView>

    {/* Cash Payment Confirmation Modal */}
    <CashPaymentConfirmationModal
      visible={showCashConfirmation}
      onClose={() => setShowCashConfirmation(false)}
      onConfirm={processCashPayment}
      orderData={{
        items,
        subtotal,
        total,
        paymentMethod: 'cash',
        status: 'pending',
        discountCode: discountCode || null,
        discountAmount: discountAmount || 0,
        discountName: discount?.name || null
      }}
      total={total}
    />
    </KeyboardAvoidingView>
    </PaymentErrorBoundary>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contentContainer: { 
    // padding handled inline with theme spacing
  },
  content: { 
    borderRadius: 24, 
    // padding handled inline with theme spacing 
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
  methodsRow: { flexDirection: 'row', justifyContent: 'center' },
  methodChip: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, borderWidth: 2.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  methodText: { fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
  summary: { borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
  itemsList: { marginBottom: 0 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1.5 },
  itemLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  itemAddOns: { fontSize: 12, marginBottom: 3, fontWeight: '500' },
  itemNotes: { fontSize: 11, fontStyle: 'italic', fontWeight: '600' },
  itemQty: { fontSize: 13, marginRight: 12, marginTop: 2, fontWeight: '700' },
  itemPrice: { fontSize: 15, fontWeight: '800', minWidth: 80, textAlign: 'right', letterSpacing: 0.2 },
  divider: { height: 2, marginVertical: 4, borderRadius: 1 },
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
