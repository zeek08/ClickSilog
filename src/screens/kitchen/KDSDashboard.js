import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, BackHandler, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orderService } from '../../services/orderService';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { appConfig } from '../../config/appConfig';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import NotificationModal from '../../components/ui/NotificationModal';

const PAGES = [
  { id: 'pending', label: 'Pending' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'all', label: 'All' }
];

const StatusBadge = ({ status, theme, borderRadius, spacing, typography }) => {
  const map = {
    pending: { 
      bg: theme.colors.primaryContainer, 
      color: theme.colors.primary, 
      label: 'Pending', 
      icon: 'time-outline',
    },
    preparing: { 
      bg: theme.colors.warningLight || theme.colors.secondaryLight || theme.colors.primaryContainer, 
      color: theme.colors.warning || theme.colors.secondary || theme.colors.primary, 
      label: 'Preparing', 
      icon: 'restaurant-outline',
    },
    ready: { 
      bg: theme.colors.successLight, 
      color: theme.colors.success, 
      label: 'Ready', 
      icon: 'checkmark-circle',
    },
    completed: { 
      bg: theme.colors.surfaceVariant, 
      color: theme.colors.textSecondary, 
      label: 'Completed', 
      icon: 'checkmark-done',
    },
    cancelled: { 
      bg: theme.colors.errorLight, 
      color: theme.colors.error, 
      label: 'Cancelled', 
      icon: 'close-circle',
    }
  };
  const s = map[status] || { 
    bg: theme.colors.surfaceVariant, 
    color: theme.colors.textSecondary, 
    label: status, 
    icon: 'help-circle-outline',
  };
  // For preparing status, use a solid border to avoid white lines
  const borderColor = status === 'preparing' 
    ? s.color 
    : (s.color + '40' || s.color);
  
  return (
    <View style={[
      styles.badge, 
      { 
        backgroundColor: s.bg, 
        borderColor: borderColor,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        paddingVertical: 3,
        paddingHorizontal: spacing.xs + 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }
    ]}>
      <Icon
        name={s.icon}
        library="ionicons"
        size={11}
        color={s.color}
        responsive={false}
        hitArea={false}
        style={{ marginRight: spacing.xs / 2 }}
      />
      <Text style={[
        styles.badgeText, 
        { 
          color: s.color,
          fontSize: 11,
          fontWeight: '600',
        }
      ]}>
        {s.label}
      </Text>
    </View>
  );
};

const timeAgoMinutes = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  const hours = Math.max(0, Math.floor(diffMs / 3600000));
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  
  // If days > 0, show days
  if (days > 0) {
    return `${days}d ago`;
  }
  
  // If hours > 0 (or minutes > 59), show hours
  if (hours > 0 || mins > 59) {
    return `${hours}hr ago`;
  }
  
  // Otherwise show minutes
  return `${mins}m ago`;
};

const KDSDashboard = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNewOrderNotification, setShowNewOrderNotification] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [cancelOrderModal, setCancelOrderModal] = useState({ visible: false, order: null });
  const [expandedItems, setExpandedItems] = useState({}); // Track expanded state for add-ons and notes
  const orderSubscriptionRef = useRef(null);
  const scrollRef = useRef(null);
  const { width } = Dimensions.get('window');

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
            await logout();
            // Use navigate instead of reset to avoid navigation errors
            try {
              const rootNav = navigation.getParent() || navigation;
              rootNav.navigate('Login');
            } catch (e) {
              // AppNavigator will handle routing after logout
              console.log('Navigation handled by AppNavigator after logout');
            }
  };

  const lastOrderIdsRef = useRef(new Set());

  // Play bell sound for new orders
  const playBellSound = () => {
    // Use vibration as audio feedback (works on both platforms)
    // For actual bell sound, install expo-av: npm install expo-av
    try {
      // Vibrate as haptic/audio feedback
      Vibration.vibrate(200); // 200ms vibration
      
      // Log for debugging
      console.log('🔔 Bell sound triggered for new order');
      
      // Note: For actual bell sound, install expo-av:
      // npm install expo-av
      // Then use: const { Audio } = require('expo-av');
      // const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/bell.mp3'));
      // await sound.playAsync();
    } catch (error) {
      // Sound library not available - just log
      console.log('🔔 New order notification (sound not available)');
    }
  };

  // Initialize order listener (same as on login)
  const initializeOrderListener = () => {
    // Unsubscribe from old listener if exists
    if (orderSubscriptionRef.current) {
      orderSubscriptionRef.current();
      orderSubscriptionRef.current = null;
    }

    // Reset notification state
    setNewOrdersCount(0);
    lastOrderIdsRef.current = new Set();

    // Subscribe to orders
    const unsub = orderService.subscribeOrders({ 
      status: undefined, 
      next: (newOrders) => {
        const currentOrderIds = new Set(newOrders.map(o => o.id));
        
        // Check for new pending orders (only paid orders)
        const newPendingOrders = newOrders.filter(o => 
          o.status === 'pending' && 
          (o.paymentStatus === 'paid' || (o.paymentMethod === 'cash' && !o.paymentStatus)) &&
          o.status !== 'pending_payment' &&
          !lastOrderIdsRef.current.has(o.id)
        );
        
        if (newPendingOrders.length > 0) {
          // New order detected!
          setNewOrdersCount(newPendingOrders.length);
          playBellSound();
          setShowNewOrderNotification({
            visible: true,
            title: 'New Order!',
            message: `You have ${newPendingOrders.length} new order${newPendingOrders.length > 1 ? 's' : ''} to prepare.`,
          });
        }
        
        lastOrderIdsRef.current = currentOrderIds;
        setOrders(newOrders);
      },
      error: (err) => {
        console.error('Order subscription error:', err);
      }
    });

    orderSubscriptionRef.current = unsub;
    return unsub;
  };

  // Initialize on mount
  useEffect(() => {
    const unsub = initializeOrderListener();
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      // Show logout confirmation on back button
      handleLogout();
      return true; // Prevent default back behavior
    });
    return () => back.remove();
  }, [navigation]);

  const onRefresh = async () => {
    // Reinitialize listeners exactly like on login
    // This ensures fresh data and resets notification state
    initializeOrderListener();
    // Reset notification badge
    setNewOrdersCount(0);
  };

  const dataByStatus = useMemo(() => {
    // CRITICAL: Only show orders that are paid (paymentStatus='paid')
    // Do NOT show pending_payment orders - they are waiting for payment confirmation
    // Kitchen should only see orders after payment is confirmed by backend webhook
    const paidOrders = orders.filter((o) => {
      // Order must have paymentStatus='paid' (confirmed by backend webhook)
      const isPaid = o.paymentStatus === 'paid';
      // Exclude pending_payment orders (waiting for payment)
      const notPendingPayment = o.status !== 'pending_payment';
      // Exclude cash orders that haven't been marked as paid yet (if applicable)
      // For cash orders, they might not have paymentStatus set, so we allow them if status is not pending_payment
      const isCashOrder = o.paymentMethod === 'cash' && !o.paymentStatus;
      return (isPaid || isCashOrder) && notPendingPayment;
    });
    
    return {
      pending: paidOrders.filter((o) => o.status === 'pending'),
      preparing: paidOrders.filter((o) => o.status === 'preparing' || o.status === 'ready'),
      all: paidOrders // Show all paid orders including cancelled
    };
  }, [orders]);

  const startOrReady = async (order) => {
    // If pending, change to preparing (stays in pending tab)
    // If preparing, change to completed (moves to all tab and labeled as complete)
    const next = order.status === 'pending' ? 'preparing' : 'completed';
    await orderService.updateStatus(order.id, next);
    // If marking as completed, switch to "All" tab
    if (next === 'completed') {
      setPageIndex(2); // Switch to "All" tab (index 2)
      // Scroll to "All" tab
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ x: width * 2, animated: true });
      }
    }
  };

  const completeOrder = async (order) => {
    // Update order status to completed (updateStatus automatically sets completedTime)
    await orderService.updateStatus(order.id, 'completed');
  };

  const cancelOrder = async (order) => {
    setCancelOrderModal({ visible: true, order });
  };

  const confirmCancelOrder = async () => {
    if (cancelOrderModal.order) {
      const order = cancelOrderModal.order;
      // Update order with cancelled status and cancellation timestamp
      await orderService.updateOrder(order.id, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'kitchen' // Track who cancelled
      });
      setCancelOrderModal({ visible: false, order: null });
    }
  };

  const Card = ({ order }) => (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        paddingTop: spacing.md + spacing.xs, // Add extra top padding to prevent overlap
        marginBottom: spacing.md,
        marginHorizontal: spacing.xs,
        borderWidth: 1,
      }
    ]}>
      <View style={[styles.cardHeader, { marginBottom: spacing.sm }]}>
        <View style={[
          styles.ticketContainer, 
          { 
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary + '40',
            borderRadius: borderRadius.md,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            borderWidth: 1.5,
            flexDirection: 'row',
            alignItems: 'center',
          }
        ]}>
          <Text style={[
            styles.ticketHash,
            { 
              color: theme.colors.primary,
              ...typography.captionBold,
            }
          ]}>
            #
          </Text>
          <Text style={[
            styles.ticket, 
            { 
              color: theme.colors.primary,
              ...typography.captionBold,
            }
          ]}>
            {order.id || 'N/A'}
          </Text>
        </View>
        <StatusBadge 
          status={order.status} 
          theme={theme}
          borderRadius={borderRadius}
          spacing={spacing}
          typography={typography}
        />
      </View>
      
      {/* Time moved to top */}
      <View style={[
        styles.timeContainer, 
        { 
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
          alignSelf: 'flex-start',
        }
      ]}>
        <Icon
          name="time-outline"
          library="ionicons"
          size={14}
          color={theme.colors.textTertiary}
          responsive={true}
          hitArea={false}
          style={{ marginRight: spacing.xs }}
        />
        <Text style={[
          styles.timeText, 
          { 
            color: theme.colors.textTertiary,
            ...typography.caption,
          }
        ]}>
          {timeAgoMinutes(order.timestamp)}
        </Text>
      </View>
      <View style={[styles.itemsBlock, { marginBottom: 0 }]}>
        {order.items?.map((i, idx) => {
          const isLastItem = idx === (order.items?.length || 0) - 1;
          const addOnsKey = `${order.id}-${idx}-addons`;
          const notesKey = `${order.id}-${idx}-notes`;
          const isAddOnsExpanded = expandedItems[addOnsKey] || false;
          const isNotesExpanded = expandedItems[notesKey] || false;
          const addOnsText = i.addOns?.map((a) => a.name).join(', ') || '';
          const notesText = i.specialInstructions || '';
          // Always show expand button if there are add-ons or notes
          const shouldShowAddOnsExpand = i.addOns?.length > 0;
          const shouldShowNotesExpand = !!i.specialInstructions;
          
          return (
          <View key={`${order.id}-item-${i.itemId || i.name || idx}-${idx}`} style={[
            styles.itemRow, 
            { 
              borderBottomColor: theme.colors.border,
              paddingBottom: isLastItem ? 0 : spacing.md,
            }
          ]}>
            <View style={[
              styles.qtyBadge, 
              { 
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: borderRadius.round,
                width: 36,
                height: 36,
                borderWidth: 1.5,
                borderColor: 'transparent',
              }
            ]}>
              <Text style={[
                styles.itemQty, 
                { 
                  color: theme.colors.primary,
                  ...typography.captionBold,
                }
              ]}>
                {i.quantity || i.qty}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md, minWidth: 0 }}>
              <Text style={[
                styles.itemName, 
                { 
                  color: theme.colors.text,
                  ...typography.bodyBold,
                  marginBottom: spacing.xs,
                }
              ]} numberOfLines={1}>
                {i.name}
              </Text>
              {!!i.addOns?.length && (
                <View style={[
                  styles.addOnsContainer, 
                  { 
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: borderRadius.sm,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    marginTop: spacing.xs,
                  }
                ]}>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: isAddOnsExpanded ? 'flex-start' : 'center',
                    minWidth: 0,
                  }}>
                    <Icon
                      name="add-circle"
                      library="ionicons"
                      size={12}
                      color={theme.colors.textSecondary}
                      style={{ marginRight: spacing.xs, marginTop: isAddOnsExpanded ? 2 : 0, flexShrink: 0 }}
                    />
                    <Text 
                      style={[
                        styles.itemAddOns, 
                        { 
                          color: theme.colors.textSecondary,
                          ...typography.caption,
                          flex: 1,
                          minWidth: 0,
                        }
                      ]} 
                      numberOfLines={isAddOnsExpanded ? undefined : 1}
                      ellipsizeMode={isAddOnsExpanded ? undefined : "tail"}
                    >
                      {addOnsText}
                    </Text>
                    {shouldShowAddOnsExpand && (
                      <AnimatedButton
                        onPress={() => setExpandedItems(prev => ({ ...prev, [addOnsKey]: !isAddOnsExpanded }))}
                        style={{
                          marginLeft: spacing.xs,
                          padding: spacing.xs,
                          backgroundColor: 'transparent',
                          minWidth: 24,
                          minHeight: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                          alignSelf: isAddOnsExpanded ? 'flex-start' : 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon
                          name={isAddOnsExpanded ? "chevron-up" : "chevron-down"}
                          library="ionicons"
                          size={16}
                          color={theme.colors.textSecondary}
                          responsive={true}
                          hitArea={false}
                        />
                      </AnimatedButton>
                    )}
                  </View>
                </View>
              )}
              {!!i.specialInstructions && (
                <View style={[
                  styles.notesContainer, 
                  { 
                    backgroundColor: theme.colors.warningLight,
                    borderColor: theme.colors.warning + '40',
                    borderRadius: borderRadius.sm,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    marginTop: spacing.xs,
                    borderWidth: 1,
                  }
                ]}>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'flex-start',
                    minWidth: 0,
                  }}>
                    <Icon
                      name="document-text"
                      library="ionicons"
                      size={14}
                      color={theme.colors.warning}
                      style={{ marginRight: spacing.xs, marginTop: 2, flexShrink: 0 }}
                    />
                    <Text 
                      style={[
                        styles.itemNotes, 
                        { 
                          color: theme.colors.warning,
                          ...typography.caption,
                          fontStyle: 'italic',
                          flex: 1,
                          minWidth: 0,
                        }
                      ]} 
                      numberOfLines={isNotesExpanded ? undefined : 2}
                      ellipsizeMode={isNotesExpanded ? undefined : "tail"}
                    >
                      {notesText}
                    </Text>
                    {shouldShowNotesExpand && (
                      <AnimatedButton
                        onPress={() => setExpandedItems(prev => ({ ...prev, [notesKey]: !isNotesExpanded }))}
                        style={{
                          marginLeft: spacing.xs,
                          padding: spacing.xs,
                          backgroundColor: 'transparent',
                          alignSelf: 'flex-start',
                          minWidth: 24,
                          minHeight: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon
                          name={isNotesExpanded ? "chevron-up" : "chevron-down"}
                          library="ionicons"
                          size={16}
                          color={theme.colors.warning}
                          responsive={true}
                          hitArea={false}
                        />
                      </AnimatedButton>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        );
        })}
      </View>
      
      {/* Action buttons at bottom */}
      <View style={[
        styles.footerRow, 
        { 
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          marginTop: 0,
          paddingTop: spacing.sm, // Reduced padding to remove blank space
        }
      ]}>
        <View style={[styles.actionsRow, { gap: spacing.sm, width: '100%' }]}>
          {order.status === 'pending' && (
            <>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  styles.actionBtnSecondary, 
                  { 
                    backgroundColor: theme.colors.errorLight,
                    borderColor: theme.colors.error,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md + spacing.xs,
                    paddingHorizontal: spacing.md,
                    borderWidth: 1.5,
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }
                ]} 
                onPress={() => cancelOrder(order)}
              >
                <Icon
                  name="close-circle"
                  library="ionicons"
                  size={18}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                  style={{ marginRight: spacing.sm }}
                />
                <Text 
                  style={[
                    styles.actionText, 
                    { 
                      color: theme.colors.error,
                      ...typography.bodyMedium,
                      fontWeight: '600',
                    }
                  ]}
                  numberOfLines={1}
                >
                  Cancel
                </Text>
              </AnimatedButton>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  { 
                    backgroundColor: theme.colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md + spacing.xs,
                    paddingHorizontal: spacing.md,
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: theme.colors.primary,
                  }
                ]} 
                onPress={() => startOrReady(order)}
              >
                <Icon
                  name="play"
                  library="ionicons"
                  size={18}
                  color={theme.colors.onPrimary}
                  responsive={true}
                  hitArea={false}
                  style={{ marginRight: spacing.sm }}
                />
                <Text 
                  style={[
                    styles.actionText,
                    { 
                      color: theme.colors.onPrimary,
                      ...typography.bodyMedium,
                      fontWeight: '600',
                    }
                  ]}
                  numberOfLines={1}
                >
                  Start
                </Text>
              </AnimatedButton>
            </>
          )}
          {order.status === 'preparing' && (
            <>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  styles.actionBtnSecondary, 
                  { 
                    backgroundColor: theme.colors.errorLight,
                    borderColor: theme.colors.error,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md + spacing.xs,
                    paddingHorizontal: spacing.md,
                    borderWidth: 1.5,
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }
                ]} 
                onPress={() => cancelOrder(order)}
              >
                <Icon
                  name="close-circle"
                  library="ionicons"
                  size={18}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                  style={{ marginRight: spacing.sm }}
                />
                <Text 
                  style={[
                    styles.actionText, 
                    { 
                      color: theme.colors.error,
                      ...typography.bodyMedium,
                      fontWeight: '600',
                    }
                  ]}
                  numberOfLines={1}
                >
                  Cancel
                </Text>
              </AnimatedButton>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  { 
                    backgroundColor: theme.colors.success,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md + spacing.xs,
                    paddingHorizontal: spacing.md,
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: theme.colors.success,
                  }
                ]} 
                onPress={() => startOrReady(order)}
              >
                <Icon
                  name="checkmark-circle"
                  library="ionicons"
                  size={18}
                  color="#FFFFFF"
                  responsive={true}
                  hitArea={false}
                  style={{ marginRight: spacing.sm }}
                />
                <Text 
                  style={[
                    styles.actionText,
                    { 
                      color: '#FFFFFF',
                      ...typography.bodyMedium,
                      fontWeight: '600',
                    }
                  ]}
                  numberOfLines={1}
                >
                  Mark Ready
                </Text>
              </AnimatedButton>
            </>
          )}
          {order.status === 'ready' && (
            <>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  styles.actionBtnSecondary, 
                  { 
                    backgroundColor: theme.colors.errorLight,
                    borderColor: theme.colors.error,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md + spacing.xs,
                    paddingHorizontal: spacing.md,
                    borderWidth: 1.5,
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }
                ]} 
                onPress={() => cancelOrder(order)}
              >
                <Icon
                  name="close-circle"
                  library="ionicons"
                  size={18}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                  style={{ marginRight: spacing.sm }}
                />
                <Text 
                  style={[
                    styles.actionText, 
                    { 
                      color: theme.colors.error,
                      ...typography.bodyMedium,
                      fontWeight: '600',
                    }
                  ]}
                  numberOfLines={1}
                >
                  Cancel
                </Text>
              </AnimatedButton>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  { 
                    backgroundColor: theme.colors.success,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md + spacing.xs,
                    paddingHorizontal: spacing.md,
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: theme.colors.success,
                  }
                ]} 
                onPress={() => completeOrder(order)}
              >
                <Icon
                  name="checkmark-done"
                  library="ionicons"
                  size={18}
                  color="#FFFFFF"
                  responsive={true}
                  hitArea={false}
                  style={{ marginRight: spacing.sm }}
                />
                <Text 
                  style={[
                    styles.actionText,
                    { 
                      color: '#FFFFFF',
                      ...typography.bodyMedium,
                      fontWeight: '600',
                    }
                  ]}
                  numberOfLines={1}
                >
                  Complete
                </Text>
              </AnimatedButton>
            </>
          )}
          {order.status === 'completed' && (
            <View style={[
              styles.completedBadge,
              {
                backgroundColor: theme.colors.successLight,
                borderColor: theme.colors.success,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderWidth: 1.5,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                width: '100%',
              }
            ]}>
              <Icon
                name="checkmark-done-circle"
                library="ionicons"
                size={18}
                color={theme.colors.success}
              />
              <Text 
                style={[
                  styles.actionText,
                  { 
                    color: theme.colors.success,
                    ...typography.bodyBold,
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                allowFontScaling={true}
              >
                Order Completed
              </Text>
            </View>
          )}
          {order.status === 'cancelled' && (
            <View style={[
              styles.completedBadge,
              {
                backgroundColor: theme.colors.errorLight,
                borderColor: theme.colors.error,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderWidth: 1.5,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                width: '100%',
              }
            ]}>
              <Icon
                name="close-circle"
                library="ionicons"
                size={18}
                color={theme.colors.error}
              />
              <Text 
                style={[
                  styles.actionText,
                  { 
                    color: theme.colors.error,
                    ...typography.bodyBold,
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                allowFontScaling={true}
              >
                Order Cancelled
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const onTabPress = (index) => {
    setPageIndex(index);
    if (scrollRef.current) scrollRef.current.scrollTo({ x: width * index, animated: true });
  };

  const onMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    if (i !== pageIndex) setPageIndex(i);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[
        styles.headerRow, 
        { 
          backgroundColor: theme.colors.surface, 
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.lg, // Increased bottom padding for more spacing
        }
      ]}>
        <View style={styles.header}>
          <View style={[styles.titleRow, { marginBottom: spacing.xs }]}>
            <Icon
              name="restaurant"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[
              styles.title, 
              { 
                color: theme.colors.text,
                ...typography.h2,
              }
            ]}>
              Kitchen Display
            </Text>
          </View>
          <Text style={[
            styles.subtitle, 
            { 
              color: theme.colors.textSecondary,
              ...typography.caption,
            }
          ]}>
            {orders.length} total orders
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AnimatedButton
            onPress={onRefresh}
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
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary + '40',
                  borderRadius: borderRadius.round,
                  width: 44,
                  height: 44,
                  borderWidth: 1.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Icon
                  name="refresh"
                  library="ionicons"
                  size={22}
                  color={theme.colors.primary}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </View>
          </AnimatedButton>
          <AnimatedButton
            onPress={handleLogout}
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
                  borderColor: theme.colors.error,
                  borderRadius: borderRadius.round,
                  width: 44,
                  height: 44,
                  borderWidth: 1.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.error,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Icon
                  name="log-out-outline"
                  library="ionicons"
                  size={22}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </View>
          </AnimatedButton>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabs,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg, // Increased top padding for more spacing from header
            paddingBottom: spacing.sm,
            gap: spacing.sm,
          }
        ]}
      >
        {PAGES.map((t, i) => (
          <AnimatedButton
            key={t.id} 
            style={[
              styles.tab, 
              pageIndex === i && { 
                backgroundColor: theme.colors.primary, 
                borderColor: theme.colors.primary,
                shadowColor: theme.colors.primary
              }, 
              { 
                backgroundColor: pageIndex === i ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: pageIndex === i ? theme.colors.primary : theme.colors.border,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderWidth: 1.5,
                minHeight: 40,
              }
            ]} 
            onPress={() => onTabPress(i)}
          >
            <Text style={[
              styles.tabText, 
              pageIndex === i && styles.tabTextActive, 
              { 
                color: pageIndex === i ? theme.colors.onPrimary : theme.colors.textSecondary,
                ...typography.captionBold,
                includeFontPadding: false,
                textAlignVertical: 'center',
              }
            ]}>
              {t.label}
            </Text>
          </AnimatedButton>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {PAGES.map((p) => {
          const ordersForPage = dataByStatus[p.id] || [];
          const hasOrders = ordersForPage.length > 0;
          return (
            <View key={p.id} style={{ width, paddingHorizontal: spacing.md }}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={{
                  paddingTop: hasOrders ? spacing.sm : 0,
                  paddingBottom: spacing.md,
                  flexGrow: 1,
                  justifyContent: 'flex-start',
                }}
              >
                {ordersForPage.map((o) => (
                <Card key={o.id} order={o} />
              ))}
                {!hasOrders && (
                  <View style={[styles.empty, { paddingTop: spacing.xl, paddingBottom: spacing.xl }]}>
                    <Icon
                      name="restaurant-outline"
                      library="ionicons"
                      size={64}
                      color={theme.colors.textTertiary}
                    />
                    <Text style={[
                      styles.emptyText, 
                      { 
                        color: theme.colors.text,
                        ...typography.h4,
                        marginTop: spacing.md,
                      }
                    ]}>
                      No {p.label.toLowerCase()} orders
                    </Text>
                    <Text style={[
                      styles.emptySubtext, 
                      { 
                        color: theme.colors.textSecondary,
                        ...typography.caption,
                        marginTop: spacing.sm,
                      }
                    ]}>
                      New orders will appear here
                    </Text>
                </View>
              )}
            </ScrollView>
          </View>
          );
        })}
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        icon="log-out-outline"
        iconColor={theme.colors.warning}
      />

      {/* Cancel Order Confirmation Modal */}
      <ConfirmationModal
        visible={cancelOrderModal.visible}
        onClose={() => setCancelOrderModal({ visible: false, order: null })}
        onConfirm={confirmCancelOrder}
        title="Cancel Order"
        message={`Are you sure you want to cancel order #${cancelOrderModal.order?.id || ''}? This action cannot be undone.`}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        confirmColor={theme.colors.error}
        icon="close-circle"
        iconColor={theme.colors.error}
      />

      {/* New Order Notification Modal */}
      <NotificationModal
        visible={showNewOrderNotification.visible}
        onClose={() => {
          setShowNewOrderNotification({ ...showNewOrderNotification, visible: false });
          setNewOrdersCount(0); // Reset badge count when notification is closed
        }}
        title={showNewOrderNotification.title}
        message={showNewOrderNotification.message}
        icon="restaurant"
        iconColor={theme.colors.info || theme.colors.primary}
        type="info"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50, // Keep for status bar spacing
    paddingHorizontal: 20,
    paddingBottom: 0, // Removed to eliminate gap - padding handled inline
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  header: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  title: { 
    // Typography handled via theme
  },
  subtitle: { 
    // Typography handled via theme
  },
  tabs: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: { 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  tabText: { 
    fontWeight: '700', 
    fontSize: 14, 
    letterSpacing: 0.3 
  },
  tabTextActive: { 
    fontWeight: '800'
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.5
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  ticketContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5
  },
  ticketHash: {
    // Typography handled via theme
    marginRight: 2
  },
  ticket: { 
    // Typography handled via theme
  },
  badge: { 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  badgeText: {
    // Typography handled via theme
  },
  itemsBlock: { marginTop: 4, marginBottom: 0 },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 0,
    borderBottomWidth: 1
  },
  qtyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  itemQty: { 
    // Typography handled via theme
  },
  itemName: { 
    // Typography handled via theme
    marginBottom: 4 
  },
  addOnsContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 4
  },
  itemAddOns: { 
    // Typography handled via theme
  },
  notesContainer: {
    // flexDirection and alignItems handled inline
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1
  },
  itemNotes: { 
    // Typography handled via theme
    fontStyle: 'italic', 
    flex: 1 
  },
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1.5 
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  timeText: { 
    // Typography handled via theme
  },
  actionsRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  actionBtnSecondary: {
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  actionText: {
    // Typography handled via theme
  },
  completedBadge: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    textAlign: 'center'
  },
  emptySubtext: {
    textAlign: 'center'
  }
});

export default KDSDashboard;
