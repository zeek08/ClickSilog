import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { orderService } from '../../services/orderService';
import Icon from '../ui/Icon';
import AnimatedButton from '../ui/AnimatedButton';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const CashierPaymentNotification = () => {
  const themeContext = useTheme();
  
  // Early return if theme is not ready
  if (!themeContext || !themeContext.theme || !themeContext.spacing || !themeContext.borderRadius || !themeContext.typography) {
    return null;
  }
  
  const { theme, spacing, borderRadius, typography } = themeContext;
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  
  // Track previous order states to detect changes
  const previousOrdersRef = useRef(new Map());
  const hasShownInitialNotificationRef = useRef(new Set());
  
  // Notification modal state
  const [notification, setNotification] = useState({
    visible: false,
    title: '',
    message: '',
    icon: null,
    iconColor: null,
    type: 'info',
  });

  // Filter orders - only customer orders with cash payment
  const cashPaymentOrders = orders.filter(order => 
    order.paymentMethod === 'cash' && order.source !== 'cashier'
  );

  // Get pending payment requests (only pending or ready status - waiting for cash payment)
  // Exclude preparing status as those are still being prepared in kitchen
  const pendingOrders = cashPaymentOrders.filter(order => {
    const status = order.status;
    return (status === 'pending' || status === 'ready') && 
           status !== 'completed' && 
           status !== 'cancelled' &&
           status !== 'preparing';
  });

  // Get resolved orders (completed)
  const resolvedOrders = cashPaymentOrders.filter(order => 
    order.status === 'completed'
  );

  // Get all orders sorted by date (newest first)
  const allOrdersSorted = [...cashPaymentOrders].sort((a, b) => 
    new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0)
  );

  // Get orders to display based on active tab
  const displayOrders = activeTab === 'pending' 
    ? pendingOrders 
    : activeTab === 'resolved'
    ? resolvedOrders
    : allOrdersSorted;

  // Get latest pending order for badge
  const latestPendingOrder = pendingOrders.length > 0 
    ? pendingOrders.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))[0]
    : null;

  useEffect(() => {
    // Subscribe to all cash payment orders
    const unsub = orderService.subscribeOrders({
      status: undefined,
      paymentMethod: 'cash',
      next: (allOrders) => {
        // Filter out cashier-created orders - only show customer orders
        const customerOrders = allOrders.filter(o => o.source !== 'cashier');
        
        setOrders(customerOrders);
        setLoading(false);
        
        // Check for new payment requests
        customerOrders.forEach((order) => {
          const orderId = order.id;
          const previousOrder = previousOrdersRef.current.get(orderId);
          const previousStatus = previousOrder?.status;
          const currentStatus = order.status;
          
          // Skip if status hasn't changed
          if (previousStatus === currentStatus) {
            previousOrdersRef.current.set(orderId, {
              status: currentStatus,
              timestamp: order.timestamp || order.createdAt
            });
            return;
          }
          
          // New payment request - show notification
          if (!previousOrder && currentStatus === 'pending') {
            if (!hasShownInitialNotificationRef.current.has(orderId)) {
              let tableInfo = '';
              let title = '';
              
              if (order.tableNumber) {
                tableInfo = `Table ${order.tableNumber}`;
                title = `Table ${order.tableNumber}`;
              } else if (order.customerName) {
                tableInfo = `Customer: ${order.customerName}`;
                title = order.customerName;
              } else {
                tableInfo = 'Customer';
                title = 'New Payment Request';
              }
              
              let message = '';
              if (order.tableNumber) {
                message = `Table ${order.tableNumber} is waiting for payment. Please go to Table ${order.tableNumber} to collect payment.`;
              } else if (order.customerName) {
                message = `Customer ${order.customerName} is waiting for payment. Please go to the customer to collect payment.`;
              } else {
                message = `A customer is waiting for payment. Please go to the customer to collect payment.`;
              }
              
              setNotification({
                visible: true,
                title: title,
                message: message,
                icon: 'cash',
                iconColor: theme.colors.success || theme.colors.primary,
                type: 'info',
              });
              
              hasShownInitialNotificationRef.current.add(orderId);
            }
          }
          
          // Update previous order state
          previousOrdersRef.current.set(orderId, {
            status: currentStatus,
            timestamp: order.timestamp || order.createdAt
          });
        });
      },
      error: (err) => {
        console.error('Order subscription error:', err);
        setLoading(false);
      }
    });
    
    return () => unsub && unsub();
  }, [theme]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Pending Payment',
        color: theme.colors.warning || theme.colors.primary,
        icon: 'time',
        bgColor: theme.colors.warningLight || theme.colors.primaryContainer,
      },
      preparing: {
        label: 'Preparing',
        color: theme.colors.info || theme.colors.primary,
        icon: 'restaurant',
        bgColor: theme.colors.infoLight || theme.colors.primaryContainer,
      },
      ready: {
        label: 'Ready',
        color: theme.colors.success,
        icon: 'checkmark-circle',
        bgColor: theme.colors.successLight,
      },
      completed: {
        label: 'Resolved',
        color: theme.colors.success,
        icon: 'checkmark-done',
        bgColor: theme.colors.successLight,
      },
      cancelled: {
        label: 'Cancelled',
        color: theme.colors.error,
        icon: 'close-circle',
        bgColor: theme.colors.errorLight,
      },
    };
    return configs[status] || configs.pending;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getTableInfo = (order) => {
    if (order.tableNumber) {
      return `Table ${order.tableNumber}`;
    } else if (order.customerName) {
      return order.customerName;
    }
    return 'Customer';
  };

  const renderOrderItem = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <View style={[
        styles.orderCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1.5,
        }
      ]}>
        <View style={styles.orderHeader}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: statusConfig.bgColor,
              borderColor: statusConfig.color + '40',
              borderRadius: borderRadius.sm,
              paddingVertical: 3,
              paddingHorizontal: spacing.xs + 2,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }
          ]}>
            <Icon
              name={statusConfig.icon}
              library="ionicons"
              size={11}
              color={statusConfig.color}
              responsive={false}
              hitArea={false}
              style={{ marginRight: spacing.xs / 2 }}
            />
            <Text style={[
              styles.statusText,
              {
                color: statusConfig.color,
                fontSize: 11,
                fontWeight: '600',
              }
            ]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={[
            styles.orderTime,
            {
              color: theme.colors.textSecondary,
              ...typography.caption,
            }
          ]}>
            {formatTime(item.timestamp || item.createdAt)}
          </Text>
        </View>
        
        <View style={[styles.orderDetails, { marginTop: spacing.sm }]}>
          <View style={{ flex: 1 }}>
            <Text style={[
              styles.tableInfo,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
              }
            ]}>
              {getTableInfo(item)}
            </Text>
            <Text style={[
              styles.orderId,
              {
                color: theme.colors.textSecondary,
                ...typography.caption,
                marginTop: spacing.xs / 2,
              }
            ]}>
              Order #{item.id?.substring(0, 8) || 'N/A'}
            </Text>
          </View>
          <Text style={[
            styles.orderTotal,
            {
              color: theme.colors.primary,
              ...typography.bodyBold,
            }
          ]}>
            ₱{Number(item.total || 0).toFixed(2)}
          </Text>
        </View>

        {item.items && item.items.length > 0 && (
          <View style={[styles.itemsList, { marginTop: spacing.xs }]}>
            {item.items.slice(0, 2).map((orderItem, idx) => (
              <Text key={idx} style={[
                styles.itemText,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                {orderItem.quantity || orderItem.qty}x {orderItem.name}
              </Text>
            ))}
            {item.items.length > 2 && (
              <Text style={[
                styles.moreItems,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                +{item.items.length - 2} more items
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!theme || !spacing || !borderRadius || !typography) {
    return null;
  }

  // Default status config for button when no pending orders
  const defaultStatusConfig = {
    color: theme.colors.textSecondary,
    bgColor: theme.colors.surfaceVariant,
  };
  const statusConfig = latestPendingOrder ? getStatusConfig(latestPendingOrder.status) : defaultStatusConfig;

  return (
    <>
      {/* Notification Button - Always visible */}
      <AnimatedButton
        onPress={() => setShowModal(true)}
        style={{
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
          position: 'relative',
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
              backgroundColor: pendingOrders.length > 0 
                ? hexToRgba(theme.colors.info || '#3B82F6', 0.1) 
                : hexToRgba(theme.colors.textSecondary || '#6D6D6D', 0.1),
              borderWidth: 1.5,
              borderColor: pendingOrders.length > 0 
                ? ((theme.colors.info || '#3B82F6') + '40') 
                : (theme.colors.border || theme.colors.textSecondary + '40'),
              padding: spacing.sm,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: pendingOrders.length > 0 ? (theme.colors.info || '#3B82F6') : theme.colors.textSecondary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Icon
              name="notifications"
              library="ionicons"
              size={22}
              color={pendingOrders.length > 0 ? (theme.colors.info || '#3B82F6') : theme.colors.textSecondary}
              responsive={true}
              hitArea={false}
            />
          </View>
        </View>
        {pendingOrders.length > 0 && (
          <View style={[
            styles.badge,
            {
              backgroundColor: theme.colors.error,
              borderRadius: borderRadius.round,
              minWidth: 20,
              height: 20,
              paddingHorizontal: spacing.xs,
              position: 'absolute',
              top: -4,
              right: -4,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: theme.colors.surface,
              zIndex: 10,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }
          ]}>
            <Text 
              style={[
                styles.badgeText,
                {
                  color: theme.colors.onError || '#FFFFFF',
                  ...typography.captionBold,
                  fontSize: 11,
                  fontWeight: 'bold',
                }
              ]}
              numberOfLines={1}
            >
              {pendingOrders.length > 99 ? '99+' : pendingOrders.length.toString()}
            </Text>
          </View>
        )}
      </AnimatedButton>

      {/* History Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingTop: spacing.lg,
              paddingHorizontal: spacing.md,
            }
          ]}>
            {/* Header */}
            <View style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1.5,
                paddingBottom: spacing.md,
                marginBottom: spacing.md,
              }
            ]}>
              <Text style={[
                styles.modalTitle,
                {
                  color: theme.colors.text,
                  ...typography.h2,
                }
              ]}>
                Payment Requests
              </Text>
              <AnimatedButton
                onPress={() => setShowModal(false)}
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
                      backgroundColor: hexToRgba(theme.colors.error, 0.1), // Soft 10% opacity halo
                      borderWidth: 1.5,
                      borderColor: theme.colors.error + '40',
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
                      size={20}
                      color={theme.colors.error}
                      responsive={true}
                      hitArea={false}
                    />
                  </View>
                </View>
              </AnimatedButton>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { marginBottom: spacing.md, gap: spacing.xs }]}>
              <AnimatedButton
                onPress={() => setActiveTab('pending')}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === 'pending' 
                      ? theme.colors.primary 
                      : theme.colors.surfaceVariant,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    flex: 1,
                    marginRight: spacing.xs,
                  }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  {
                    color: activeTab === 'pending' 
                      ? theme.colors.onPrimary 
                      : theme.colors.text,
                    ...typography.bodyBold,
                  }
                ]}>
                  Pending ({pendingOrders.length})
                </Text>
              </AnimatedButton>
              <AnimatedButton
                onPress={() => setActiveTab('resolved')}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === 'resolved' 
                      ? theme.colors.success 
                      : theme.colors.surfaceVariant,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    flex: 1,
                    marginRight: spacing.xs,
                  }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  {
                    color: activeTab === 'resolved' 
                      ? '#FFFFFF' 
                      : theme.colors.text,
                    ...typography.bodyBold,
                  }
                ]}>
                  Resolved ({resolvedOrders.length})
                </Text>
              </AnimatedButton>
              <AnimatedButton
                onPress={() => setActiveTab('all')}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === 'all' 
                      ? theme.colors.primary 
                      : theme.colors.surfaceVariant,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    flex: 1,
                  }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  {
                    color: activeTab === 'all' 
                      ? theme.colors.onPrimary 
                      : theme.colors.text,
                    ...typography.bodyBold,
                  }
                ]}>
                  All ({allOrdersSorted.length})
                </Text>
              </AnimatedButton>
            </View>

            {/* Orders List */}
            {loading ? (
              <View style={[styles.empty, { padding: spacing.xxl }]}>
                <Text style={[
                  styles.emptyText,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  Loading...
                </Text>
              </View>
            ) : displayOrders.length === 0 ? (
              <View style={[styles.empty, { padding: spacing.xxl }]}>
                <Icon
                  name="cash-outline"
                  library="ionicons"
                  size={64}
                  color={theme.colors.textTertiary}
                />
                <Text style={[
                  styles.emptyText,
                  {
                    color: theme.colors.text,
                    ...typography.h3,
                    marginTop: spacing.lg,
                  }
                ]}>
                  {activeTab === 'pending' 
                    ? 'No pending payments' 
                    : activeTab === 'resolved'
                    ? 'No resolved payments'
                    : 'No payment requests'}
                </Text>
                <Text style={[
                  styles.emptySubtext,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                    marginTop: spacing.sm,
                    textAlign: 'center',
                  }
                ]}>
                  {activeTab === 'pending' 
                    ? 'Payment requests from customers will appear here' 
                    : activeTab === 'resolved'
                    ? 'Completed payment requests will appear here'
                    : 'All payment requests will appear here'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={displayOrders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrderItem}
                contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Notification Modal */}
      {notification.visible && (
        <Modal
          visible={notification.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setNotification({ ...notification, visible: false })}
        >
          <View style={[styles.notificationOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: spacing.md }]}>
            <View style={[
              styles.notificationContainer,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
              }
            ]}>
              <Icon
                name={notification.icon || 'cash'}
                library="ionicons"
                size={48}
                color={notification.iconColor || theme.colors.primary}
              />
              <Text style={[
                styles.notificationTitle,
                {
                  color: theme.colors.text,
                  ...typography.h3,
                  marginTop: spacing.md,
                }
              ]}>
                {notification.title}
              </Text>
              <Text style={[
                styles.notificationMessage,
                {
                  color: theme.colors.textSecondary,
                  ...typography.body,
                  marginTop: spacing.sm,
                  textAlign: 'center',
                }
              ]}>
                {notification.message}
              </Text>
              <AnimatedButton
                onPress={() => setNotification({ ...notification, visible: false })}
                style={[
                  styles.notificationButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.xl,
                    marginTop: spacing.lg,
                  }
                ]}
              >
                <Text style={[
                  styles.notificationButtonText,
                  {
                    color: theme.colors.onPrimary,
                    ...typography.bodyBold,
                  }
                ]}>
                  OK
                </Text>
              </AnimatedButton>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    // Styles handled inline
  },
  badgeText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    // paddingTop and paddingHorizontal moved to inline styles
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    // gap moved to inline styles
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    textAlign: 'center',
  },
  orderCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '600',
  },
  orderTime: {
    fontWeight: '500',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tableInfo: {
    fontWeight: 'bold',
  },
  orderId: {
    fontWeight: '500',
  },
  orderTotal: {
    fontWeight: 'bold',
  },
  itemsList: {
    marginTop: 4,
  },
  itemText: {
    fontWeight: '400',
  },
  moreItems: {
    fontWeight: '500',
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptySubtext: {
    textAlign: 'center',
  },
  notificationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding will be set dynamically using theme.spacing
  },
  notificationContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  notificationMessage: {
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationButtonText: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default CashierPaymentNotification;

