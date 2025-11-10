import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, ScrollView, AppState, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import { firestoreService } from '../../services/firestoreService';
import { paymentService } from '../../services/paymentService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { alertService } from '../../services/alertService';

const GCashPaymentScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { user } = useContext(AuthContext);
  const { clearCart } = useCart();
  
  const { orderId, sourceId, checkoutSessionId, checkoutUrl, qrData, expiresAt, amount, paymentType } = route?.params || {};
  
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQrData, setCurrentQrData] = useState(qrData);
  const [currentCheckoutUrl, setCurrentCheckoutUrl] = useState(checkoutUrl);
  const [currentExpiresAt, setCurrentExpiresAt] = useState(expiresAt);

  // Validate required params
  useEffect(() => {
    if (!orderId || !amount) {
      alertService.error('Error', 'Missing payment information. Please try again.');
      navigation.goBack();
    }
  }, [orderId, amount, navigation]);

  // Define handlers before useEffect to avoid dependency issues
  const handlePaymentSuccess = React.useCallback(() => {
    clearCart();
    alertService.success('Payment Confirmed', 'Your payment has been confirmed. Your order is being prepared!');
    // Navigate back to menu/home
    setTimeout(() => {
      navigation.popToTop();
    }, 2000);
  }, [clearCart, navigation]);

  const handlePaymentExpired = React.useCallback(() => {
    setPaymentStatus('expired');
    alertService.warning('Payment Expired', 'The payment QR code has expired. Please try again.');
  }, []);

  // Calculate time remaining
  useEffect(() => {
    const expiryTime = currentExpiresAt || expiresAt;
    if (!expiryTime) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiryTime);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        // Payment expired
        handlePaymentExpired();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining({ minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentExpiresAt, expiresAt, handlePaymentExpired]);

  // Monitor order payment status
  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = orderService.subscribeOrders({
      status: null, // Get all statuses
      next: (orders) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const newStatus = order.paymentStatus || order.status;
          
          if (newStatus === 'paid' && paymentStatus !== 'paid') {
            setPaymentStatus('paid');
            handlePaymentSuccess();
          } else if (newStatus === 'failed' || newStatus === 'expired') {
            setPaymentStatus(newStatus);
          }
        }
      },
      error: (error) => {
        console.error('Error monitoring order:', error);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId, paymentStatus, handlePaymentSuccess]);

  // Monitor app state changes (for Android - when user returns from browser)
  useEffect(() => {
    if (!orderId || paymentStatus === 'paid') return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // When app comes to foreground, check payment status
      if (nextAppState === 'active') {
        // Refresh order status when user returns from browser
        firestoreService.getDocument('orders', orderId).then((order) => {
          if (order) {
            const newStatus = order.paymentStatus || order.status;
            if (newStatus === 'paid' && paymentStatus !== 'paid') {
              setPaymentStatus('paid');
              handlePaymentSuccess();
            } else if (newStatus === 'failed' || newStatus === 'expired') {
              setPaymentStatus(newStatus);
            } else if (newStatus === 'pending' && order.paymentIntentId) {
              // If still pending, manually check payment status from PayMongo
              // This is a fallback if webhook didn't fire
              paymentService.checkPaymentStatusViaFunction({
                orderId,
                paymentIntentId: order.paymentIntentId,
              }).then((result) => {
                if (result.success && result.status === 'paid') {
                  setPaymentStatus('paid');
                  handlePaymentSuccess();
                }
              }).catch((error) => {
                console.error('Error checking payment status:', error);
              });
            }
          }
        }).catch((error) => {
          console.error('Error checking order status:', error);
        });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [orderId, paymentStatus, handlePaymentSuccess]);

  // Poll payment status periodically (fallback if webhook fails)
  useEffect(() => {
    if (!orderId || paymentStatus === 'paid') return;

    // Poll every 5 seconds for the first minute, then every 10 seconds
    const pollInterval = setInterval(async () => {
      try {
        const order = await firestoreService.getDocument('orders', orderId);
        if (order) {
          const currentStatus = order.paymentStatus || order.status;
          
          // If still pending and we have paymentIntentId, check PayMongo directly
          if (currentStatus === 'pending' && order.paymentIntentId) {
            const result = await paymentService.checkPaymentStatusViaFunction({
              orderId,
              paymentIntentId: order.paymentIntentId,
            });
            
            if (result.success && result.status === 'paid') {
              setPaymentStatus('paid');
              handlePaymentSuccess();
              clearInterval(pollInterval);
            }
          } else if (currentStatus === 'paid' && paymentStatus !== 'paid') {
            setPaymentStatus('paid');
            handlePaymentSuccess();
            clearInterval(pollInterval);
          } else if (currentStatus === 'failed' || currentStatus === 'expired') {
            setPaymentStatus(currentStatus);
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [orderId, paymentStatus, handlePaymentSuccess]);

  const handleOpenCheckout = async () => {
    const url = currentCheckoutUrl || checkoutUrl;
    if (url) {
      try {
        // On Android, Linking.openURL opens in default browser
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          // Show message that user can return to app after payment
          alertService.info(
            'Payment Page Opened',
            'Complete your payment in the browser. Return to this app to see payment confirmation.'
          );
        } else {
          alertService.error('Error', 'Cannot open payment link. Please check your browser settings.');
        }
      } catch (error) {
        console.error('Error opening checkout URL:', error);
        alertService.error('Error', 'Failed to open payment link. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleRetry = async () => {
    if (!orderId || !amount) {
      alertService.error('Error', 'Missing payment information. Please try again.');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus('pending');

      // Regenerate payment source for the same order (always use QR PH API)
      const paymentResult = await paymentService.processPayment({
        amount,
        currency: 'PHP',
        description: `ClickSiLog Order #${orderId}`,
        orderId,
        paymentMethod: 'gcash',
        tableNumber: user?.tableNumber || null
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to regenerate payment');
      }

      // Update state with new payment data
      setCurrentQrData(paymentResult.qrData);
      setCurrentCheckoutUrl(paymentResult.checkoutUrl);
      setCurrentExpiresAt(paymentResult.expiresAt);
      
      // Update route params for navigation state
      route.params = {
        ...route.params,
        sourceId: paymentResult.sourceId,
        checkoutSessionId: paymentResult.checkoutSessionId,
        checkoutUrl: paymentResult.checkoutUrl,
        qrData: paymentResult.qrData,
        expiresAt: paymentResult.expiresAt,
      };

      alertService.success('QR Code Regenerated', 'A new payment QR code has been generated. Please scan it with GCash.');
    } catch (error) {
      console.error('Error regenerating payment:', error);
      alertService.error('Error', error.message || 'Failed to regenerate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amt) => {
    return `₱${Number(amt || 0).toFixed(2)}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.md,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }
      ]}>
        <AnimatedButton
          onPress={handleCancel}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.colors.error + '20',
              borderColor: theme.colors.error,
              borderRadius: borderRadius.round,
              padding: spacing.sm,
              borderWidth: 1.5,
            }
          ]}
        >
          <Icon
            name="arrow-back"
            library="ionicons"
            size={22}
            color={theme.colors.error}
            responsive={false}
            hitArea={false}
          />
        </AnimatedButton>
        <Text style={[
          styles.headerTitle,
          {
            color: theme.colors.text,
            ...typography.h3,
            marginLeft: spacing.md,
          }
        ]}>
          GCash Payment
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { padding: spacing.lg }
        ]}
      >
        {paymentStatus === 'pending' && (
          <>
            {/* Instructions */}
            <View style={[
              styles.instructionCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
              }
            ]}>
              <Icon
                name="information-circle"
                library="ionicons"
                size={32}
                color={theme.colors.primary}
                style={{ marginBottom: spacing.md }}
              />
              <Text style={[
                styles.instructionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                  marginBottom: spacing.sm,
                }
              ]}>
                {(currentQrData || qrData) ? 'Scan with GCash to Pay' : 'Complete Payment on PayMongo'}
              </Text>
              <Text style={[
                styles.instructionText,
                {
                  color: theme.colors.textSecondary,
                  ...typography.body,
                  textAlign: 'center',
                  marginBottom: spacing.md,
                }
              ]}>
                Do not close this screen until payment is confirmed.
              </Text>
              <Text style={[
                styles.orderInfo,
                {
                  color: theme.colors.text,
                  ...typography.bodyBold,
                  marginTop: spacing.md,
                }
              ]}>
                Order: {orderId}
              </Text>
              <Text style={[
                styles.amountInfo,
                {
                  color: theme.colors.primary,
                  ...typography.h3,
                  marginTop: spacing.sm,
                }
              ]}>
                Amount: {formatAmount(amount)}
              </Text>
            </View>

            {/* QR Code / Checkout URL */}
            <View style={[
              styles.qrCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.xl,
                marginBottom: spacing.lg,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }
            ]}>
              {(currentQrData || qrData) ? (
                <>
                  <Text style={[
                    styles.qrLabel,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.caption,
                      marginBottom: spacing.md,
                    }
                  ]}>
                    Scan this QR code with GCash
                  </Text>
                  {/* Display the actual QR code image from PayMongo */}
                  <Image
                    source={{ uri: currentQrData || qrData }}
                    style={[
                      styles.qrImage,
                      {
                        width: 250,
                        height: 250,
                        borderRadius: borderRadius.md,
                        backgroundColor: theme.colors.surfaceVariant,
                      }
                    ]}
                    resizeMode="contain"
                  />
                </>
              ) : (currentCheckoutUrl || checkoutUrl) ? (
                <>
                  <Icon
                    name="link"
                    library="ionicons"
                    size={64}
                    color={theme.colors.primary}
                    style={{ marginBottom: spacing.md }}
                  />
                  <Text style={[
                    styles.qrLabel,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.body,
                      marginBottom: spacing.md,
                      textAlign: 'center',
                    }
                  ]}>
                    Click the button below to open the payment page
                  </Text>
                  <AnimatedButton
                    onPress={handleOpenCheckout}
                    style={[
                      styles.openButton,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: borderRadius.md,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                      }
                    ]}
                  >
                    <Icon
                      name="open-outline"
                      library="ionicons"
                      size={20}
                      color={theme.colors.onPrimary}
                      style={{ marginRight: spacing.xs }}
                      responsive={false}
                      hitArea={false}
                    />
                    <Text style={[
                      styles.openButtonText,
                      {
                        color: theme.colors.onPrimary,
                        ...typography.bodyBold,
                      }
                    ]}>
                      Open Payment Page
                    </Text>
                  </AnimatedButton>
                </>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[
                    styles.loadingText,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.body,
                      marginTop: spacing.md,
                    }
                    ]}>
                    Loading payment information...
                  </Text>
                </View>
              )}
            </View>

            {/* Timer */}
            {timeRemaining && (
              <View style={[
                styles.timerCard,
                {
                  backgroundColor: theme.colors.warning + '20',
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.warning + '40',
                }
              ]}>
                <Icon
                  name="time"
                  library="ionicons"
                  size={20}
                  color={theme.colors.warning}
                  style={{ marginRight: spacing.xs }}
                  responsive={false}
                  hitArea={false}
                />
                <Text style={[
                  styles.timerText,
                  {
                    color: theme.colors.warning,
                    ...typography.bodyMedium,
                  }
                ]}>
                  Time remaining: {String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
                </Text>
              </View>
            )}

            {/* Waiting Status */}
            <View style={[
              styles.statusCard,
              {
                backgroundColor: theme.colors.info + '20',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.colors.info + '40',
              }
            ]}>
              <ActivityIndicator size="small" color={theme.colors.info} style={{ marginRight: spacing.sm }} />
              <Text style={[
                styles.statusText,
                {
                  color: theme.colors.info,
                  ...typography.bodyMedium,
                }
              ]}>
                Waiting for payment confirmation...
              </Text>
            </View>
          </>
        )}

        {paymentStatus === 'paid' && (
          <View style={[
            styles.successCard,
            {
              backgroundColor: theme.colors.success + '20',
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: theme.colors.success,
            }
          ]}>
            <Icon
              name="checkmark-circle"
              library="ionicons"
              size={80}
              color={theme.colors.success}
              style={{ marginBottom: spacing.md }}
            />
            <Text style={[
              styles.successTitle,
              {
                color: theme.colors.success,
                ...typography.h3,
                marginBottom: spacing.sm,
              }
            ]}>
              Payment Confirmed!
            </Text>
            <Text style={[
              styles.successText,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
                textAlign: 'center',
              }
            ]}>
              Your order is being prepared. You will be notified when it's ready.
            </Text>
          </View>
        )}

        {(paymentStatus === 'expired' || paymentStatus === 'failed') && (
          <View style={[
            styles.errorCard,
            {
              backgroundColor: theme.colors.error + '20',
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: theme.colors.error,
            }
          ]}>
            <Icon
              name="close-circle"
              library="ionicons"
              size={80}
              color={theme.colors.error}
              style={{ marginBottom: spacing.md }}
            />
            <Text style={[
              styles.errorTitle,
              {
                color: theme.colors.error,
                ...typography.h3,
                marginBottom: spacing.sm,
              }
            ]}>
              {paymentStatus === 'expired' ? 'Payment Expired' : 'Payment Failed'}
            </Text>
            <Text style={[
              styles.errorText,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
                textAlign: 'center',
                marginBottom: spacing.lg,
              }
            ]}>
              {paymentStatus === 'expired' 
                ? 'The payment QR code has expired. Please try again.'
                : 'Payment could not be processed. Please try again.'}
            </Text>
            <AnimatedButton
              onPress={handleRetry}
              style={[
                styles.retryButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                }
              ]}
            >
              <Text style={[
                styles.retryButtonText,
                {
                  color: theme.colors.onPrimary,
                  ...typography.bodyBold,
                }
              ]}>
                Try Again
              </Text>
            </AnimatedButton>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  instructionCard: {
    alignItems: 'center',
  },
  instructionTitle: {
    textAlign: 'center',
  },
  instructionText: {
    textAlign: 'center',
  },
  orderInfo: {
    textAlign: 'center',
  },
  amountInfo: {
    textAlign: 'center',
  },
  qrCard: {
    minHeight: 300,
  },
  qrLabel: {
    textAlign: 'center',
  },
  qrImage: {
    borderWidth: 2,
    borderColor: '#000',
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    textAlign: 'center',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  openButtonText: {
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    textAlign: 'center',
  },
  successCard: {
    alignItems: 'center',
  },
  successTitle: {
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'center',
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    textAlign: 'center',
  },
});

export default GCashPaymentScreen;

