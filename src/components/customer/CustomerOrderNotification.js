import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import Icon from '../ui/Icon';
import AnimatedButton from '../ui/AnimatedButton';
import NotificationModal from '../ui/NotificationModal';

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

const CustomerOrderNotification = () => {
  const themeContext = useTheme();
  const { theme, spacing, borderRadius, typography } = themeContext || {};
  const { user } = useContext(AuthContext);
  
  // Safety check - return null if theme is not ready
  if (!theme || !spacing || !borderRadius || !typography) {
    return null;
  }
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'active'
  
  // Track previous order states to detect changes
  const previousOrdersRef = useRef(new Map());
  const hasShownInitialNotificationRef = useRef(new Set());
  const hasShownCompletedNotificationRef = useRef(new Set());
  
  // Notification modal state
  const [notification, setNotification] = useState({
    visible: false,
    title: '',
    message: '',
    icon: null,
    iconColor: null,
    type: 'info',
  });

  // Orders are already filtered by tableNumber or userId from orderService
  const customerOrders = orders;

  // Get active orders (not completed)
  const activeOrders = customerOrders.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  );

  // Get all orders sorted by date (newest first)
  const allOrdersSorted = [...customerOrders].sort((a, b) => 
    new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0)
  );

  // Get orders to display based on active tab
  const displayOrders = activeTab === 'active' ? activeOrders : allOrdersSorted;

  // Get latest order status for badge
  const latestOrder = activeOrders.length > 0 
    ? activeOrders.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))[0]
    : null;

  useEffect(() => {
    if (!user) return;

    // Subscribe to orders filtered by tableNumber or userId
    const unsub = orderService.subscribeOrders({
      status: undefined,
      tableNumber: user?.tableNumber || undefined,
      userId: user?.uid || undefined,
      next: (allOrders) => {
        // Check for status changes and new orders
        allOrders.forEach((order) => {
          const orderId = order.id;
          const previousOrder = previousOrdersRef.current.get(orderId);
          const previousStatus = previousOrder?.status;
          const currentStatus = order.status;
          
          // Skip if status hasn't changed
          if (previousStatus === currentStatus) {
            // Still update the ref to track the order
            previousOrdersRef.current.set(orderId, {
              status: currentStatus,
              timestamp: order.timestamp || order.createdAt
            });
            return;
          }
          
          // New order - show "Order placed" notification
          if (!previousOrder && currentStatus === 'pending') {
            if (!hasShownInitialNotificationRef.current.has(orderId)) {
              setNotification({
                visible: true,
                title: 'Order Placed!',
                message: `Your order #${orderId} has been placed successfully. We'll notify you when it's ready!`,
                icon: 'checkmark-circle',
                iconColor: theme.colors.success,
                type: 'success',
              });
              hasShownInitialNotificationRef.current.add(orderId);
            }
          }
          // Status changed to preparing (from pending or any other status)
          else if (previousStatus !== 'preparing' && currentStatus === 'preparing') {
            setNotification({
              visible: true,
              title: 'Order Update',
              message: `Your order #${orderId} is now being prepared!`,
              icon: 'restaurant',
              iconColor: theme.colors.info || theme.colors.primary,
              type: 'info',
            });
          }
          // Status changed to ready (from any previous status except ready)
          else if (previousStatus !== 'ready' && currentStatus === 'ready') {
            setNotification({
              visible: true,
              title: 'Order Ready!',
              message: `Your order #${orderId} is ready for pickup!`,
              icon: 'checkmark-circle',
              iconColor: theme.colors.success,
              type: 'success',
            });
          }
          // Status changed to completed (from any previous status except completed)
          // Only show notification if:
          // 1. Status actually changed (not on initial load)
          // 2. Completed recently (within last 10 minutes)
          // 3. Haven't shown this notification before
          else if (previousStatus !== 'completed' && currentStatus === 'completed' && previousStatus !== undefined) {
            const completedAt = order.completedAt || order.updatedAt || order.timestamp || order.createdAt;
            const completedTime = new Date(completedAt).getTime();
            const now = Date.now();
            const tenMinutesAgo = now - (10 * 60 * 1000); // 10 minutes in milliseconds
            
            // Only show notification if:
            // - Completed within the last 10 minutes
            // - Haven't shown this notification for this order before
            if (completedTime > tenMinutesAgo && !hasShownCompletedNotificationRef.current.has(orderId)) {
              setNotification({
                visible: true,
                title: 'Order Completed!',
                message: `Thank you for your order #${orderId}! Enjoy your meal!`,
                icon: 'checkmark-done-circle',
                iconColor: theme.colors.success,
                type: 'success',
              });
              hasShownCompletedNotificationRef.current.add(orderId);
            }
          }
          
          // Update previous order state
          previousOrdersRef.current.set(orderId, {
            status: currentStatus,
            timestamp: order.timestamp || order.createdAt
          });
        });
        
        // Remove orders that no longer exist
        const currentOrderIds = new Set(allOrders.map(o => o.id));
        previousOrdersRef.current.forEach((_, orderId) => {
          if (!currentOrderIds.has(orderId)) {
            previousOrdersRef.current.delete(orderId);
            hasShownInitialNotificationRef.current.delete(orderId);
            hasShownCompletedNotificationRef.current.delete(orderId);
          }
        });
        
        setOrders(allOrders);
        setLoading(false);
      },
      error: (err) => {
        console.error('Order subscription error:', err);
        setLoading(false);
      }
    });

    return () => unsub && unsub();
  }, [user]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Pending',
        color: theme.colors.warning,
        icon: 'time',
        bgColor: theme.colors.warningLight + '30',
      },
      preparing: {
        label: 'Preparing',
        color: theme.colors.info,
        icon: 'restaurant',
        bgColor: theme.colors.infoLight + '30',
      },
      ready: {
        label: 'Ready',
        color: theme.colors.success,
        icon: 'checkmark-circle',
        bgColor: theme.colors.successLight + '30',
      },
      completed: {
        label: 'Completed',
        color: theme.colors.textSecondary,
        icon: 'checkmark-done',
        bgColor: theme.colors.surfaceVariant,
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
          <Text style={[
            styles.orderId,
            {
              color: theme.colors.text,
              ...typography.bodyBold,
            }
          ]}>
            Order #{item.id || 'N/A'}
          </Text>
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

  if (!user) {
    return null;
  }

  // Default status config for button when no active orders
  const defaultStatusConfig = {
    color: theme.colors.textSecondary,
    bgColor: theme.colors.surfaceVariant,
  };
  const statusConfig = latestOrder ? getStatusConfig(latestOrder.status) : defaultStatusConfig;

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
              backgroundColor: activeOrders.length > 0 
                ? hexToRgba(theme.colors.info || '#3B82F6', 0.1) 
                : hexToRgba(theme.colors.textSecondary || '#6D6D6D', 0.1), // Soft 10% opacity halo
              borderWidth: 1.5,
              borderColor: activeOrders.length > 0 
                ? ((theme.colors.info || '#3B82F6') + '40') 
                : (theme.colors.border || theme.colors.textSecondary + '40'),
              padding: spacing.sm,
              borderRadius: 999, // Perfect circle
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: activeOrders.length > 0 ? (theme.colors.info || '#3B82F6') : theme.colors.textSecondary,
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
          color={activeOrders.length > 0 ? theme.colors.info : theme.colors.textSecondary}
          responsive={true}
          hitArea={false}
        />
          </View>
        </View>
        {activeOrders.length > 0 && (
          <View style={[
            styles.badge,
            {
              backgroundColor: theme.colors.error,
              borderRadius: borderRadius.round,
              minWidth: 20,
              height: 20,
              paddingHorizontal: spacing.xs,
            }
          ]}>
            <Text style={[
              styles.badgeText,
              {
                color: theme.colors.onError || '#FFFFFF',
                ...typography.captionBold,
                fontSize: 11,
              }
            ]}>
              {activeOrders.length}
            </Text>
          </View>
        )}
      </AnimatedButton>

      {/* Notification Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: spacing.md }]}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: borderRadius.xl,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
            }
          ]}>
            {/* Header */}
            <View style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1.5,
                padding: spacing.lg,
                paddingBottom: spacing.md,
                marginBottom: spacing.md,
              }
            ]}>
              <View style={styles.headerRow}>
                <Icon
                  name="notifications"
                  library="ionicons"
                  size={28}
                  color={theme.colors.primary}
                />
                <Text style={[
                  styles.modalTitle,
                  {
                    color: theme.colors.text,
                    ...typography.h2,
                    marginLeft: spacing.sm,
                  }
                ]}>
                  Order History
                </Text>
              </View>
              <AnimatedButton
                onPress={() => setShowModal(false)}
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
            <View style={[
              styles.tabsContainer,
              {
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.md,
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
              }
            ]}>
              <TouchableOpacity
                onPress={() => setActiveTab('all')}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === 'all' ? theme.colors.primaryContainer : 'transparent',
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    marginRight: spacing.sm,
                  }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  {
                    color: activeTab === 'all' ? theme.colors.primary : theme.colors.textSecondary,
                    ...typography.bodyBold,
                  }
                ]}>
                  All ({customerOrders.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('active')}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === 'active' ? theme.colors.primaryContainer : 'transparent',
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                  }
                ]}
              >
                <Text style={[
                  styles.tabText,
                  {
                    color: activeTab === 'active' ? theme.colors.primary : theme.colors.textSecondary,
                    ...typography.bodyBold,
                  }
                ]}>
                  Active ({activeOrders.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Orders List */}
            {loading ? (
              <View style={[styles.loadingContainer, { padding: spacing.xxl }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : displayOrders.length > 0 ? (
              <FlatList
                data={displayOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.listContent,
                  {
                    padding: spacing.md,
                    paddingBottom: spacing.xxl,
                  }
                ]}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={10}
                windowSize={10}
              />
            ) : (
              <View style={[styles.emptyContainer, { padding: spacing.xxl }]}>
                <Icon
                  name={activeTab === 'active' ? 'checkmark-done-circle' : 'receipt-outline'}
                  library="ionicons"
                  size={64}
                  color={theme.colors.textTertiary}
                />
                <Text style={[
                  styles.emptyText,
                  {
                    color: theme.colors.text,
                    ...typography.h3,
                    marginTop: spacing.md,
                  }
                ]}>
                  {activeTab === 'active' ? 'No Active Orders' : 'No Orders Yet'}
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
                  {activeTab === 'active' 
                    ? 'Your active orders will appear here'
                    : 'Your order history will appear here'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Notification Modal */}
      <NotificationModal
        visible={notification.visible}
        onClose={() => setNotification({ ...notification, visible: false })}
        title={notification.title}
        message={notification.message}
        icon={notification.icon}
        iconColor={notification.iconColor}
        type={notification.type}
      />
    </>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Padding handled inline
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    // Padding handled inline
  },
  orderCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    fontWeight: 'bold',
  },
  orderTime: {
    // Typography handled via theme
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: 'bold',
  },
  orderTotal: {
    fontWeight: 'bold',
  },
  itemsList: {
    // Margin handled inline
  },
  itemText: {
    // Typography handled via theme
  },
  moreItems: {
    fontStyle: 'italic',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontWeight: 'bold',
  },
  emptySubtext: {
    // Typography handled via theme
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    // Styles handled inline
  },
  tabText: {
    // Typography handled via theme
  },
});

export default CustomerOrderNotification;

