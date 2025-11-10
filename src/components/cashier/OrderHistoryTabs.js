import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { orderService } from '../../services/orderService';
import Icon from '../ui/Icon';
import AnimatedButton from '../ui/AnimatedButton';

const TABS = [
  { id: 'pending', label: 'Pending', icon: 'time' },
  { id: 'completed', label: 'Completed', icon: 'checkmark-circle' },
];

const OrderHistoryTabs = () => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubPending, unsubPreparing, unsubReady, unsubCompleted;

    unsubPending = orderService.subscribeOrders({
      status: 'pending',
      next: (orders) => {
        setPendingOrders((prev) => {
          const filtered = prev.filter((o) => o.status !== 'pending');
          return [...filtered, ...orders];
        });
        setLoading(false);
      },
    });

    unsubPreparing = orderService.subscribeOrders({
      status: 'preparing',
      next: (orders) => {
        setPendingOrders((prev) => {
          const filtered = prev.filter((o) => o.status !== 'preparing');
          return [...filtered, ...orders];
        });
      },
    });

    unsubReady = orderService.subscribeOrders({
      status: 'ready',
      next: (orders) => {
        setPendingOrders((prev) => {
          const filtered = prev.filter((o) => o.status !== 'ready');
          return [...filtered, ...orders];
        });
      },
    });

    unsubCompleted = orderService.subscribeOrders({
      status: 'completed',
      next: (orders) => {
        setCompletedOrders(orders);
      },
    });

    return () => {
      if (unsubPending) unsubPending();
      if (unsubPreparing) unsubPreparing();
      if (unsubReady) unsubReady();
      if (unsubCompleted) unsubCompleted();
    };
  }, []);

  const currentOrders = useMemo(() => {
    if (activeTab === 'pending') {
      const allPending = [...pendingOrders];
      return allPending.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });
    }
    return completedOrders.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA; // Most recent first
    });
  }, [activeTab, pendingOrders, completedOrders]);

  const renderOrder = ({ item }) => {
    const statusConfig = {
      pending: { color: theme.colors.warning, label: 'Pending', icon: 'time' },
      preparing: { color: theme.colors.info, label: 'Preparing', icon: 'restaurant' },
      ready: { color: theme.colors.success, label: 'Ready', icon: 'checkmark-circle' },
      completed: { color: theme.colors.textSecondary, label: 'Completed', icon: 'checkmark-done' },
    };

    const config = statusConfig[item.status] || statusConfig.pending;

    return (
      <View style={[
        styles.orderCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: borderRadius.xl,
          padding: spacing.md,
          marginBottom: spacing.md,
          marginHorizontal: spacing.md,
          borderWidth: 1,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }
      ]}>
        <View style={styles.orderHeader}>
          <View style={[
            styles.orderBadge,
            {
              backgroundColor: config.color + '20',
              borderRadius: borderRadius.md,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderWidth: 1.5,
              borderColor: config.color + '40',
            }
          ]}>
            <Icon
              name={config.icon}
              library="ionicons"
              size={14}
              color={config.color}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={[
              styles.orderStatus,
              {
                color: config.color,
                ...typography.captionBold,
              }
            ]}>
              {config.label}
            </Text>
          </View>
          <Text style={[
            styles.orderId,
            {
              color: theme.colors.textSecondary,
              ...typography.caption,
            }
          ]}>
            #{item.id || 'N/A'}
          </Text>
        </View>

        <Text style={[
          styles.customerName,
          {
            color: theme.colors.text,
            ...typography.bodyBold,
            marginTop: spacing.sm,
            marginBottom: spacing.xs,
          }
        ]}>
          {item.customerName || 'Walk-in Customer'}
        </Text>

        <View style={[styles.itemsList, { marginTop: spacing.xs }]}>
          {item.items?.map((i, idx) => (
            <View key={`${item.id || 'order'}-item-${i.itemId || i.name || idx}-${idx}`} style={[styles.itemLine, { marginBottom: spacing.xs / 2 }]}>
              <Text style={[
                styles.itemText,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                {i.quantity || i.qty}x {i.name}
              </Text>
              {i.addOns?.length > 0 && (
                <Text style={[
                  styles.addOnsText,
                  {
                    color: theme.colors.textTertiary,
                    ...typography.caption,
                    marginLeft: spacing.sm,
                  }
                ]}>
                  ({i.addOns.map((a) => a.name).join(', ')})
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={[
          styles.totalRow,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            marginTop: spacing.sm,
          }
        ]}>
          <Icon
            name="cash"
            library="ionicons"
            size={18}
            color={theme.colors.primary}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[
            styles.totalAmount,
            {
              color: theme.colors.primary,
              ...typography.h4,
            }
          ]}>
            ₱{Number(item.total || 0).toFixed(2)}
          </Text>
          {item.paymentMethod && (
            <View style={[
              styles.paymentBadge,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: borderRadius.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                marginLeft: spacing.sm,
              }
            ]}>
              <Text style={[
                styles.paymentMethod,
                {
                  color: theme.colors.primary,
                  ...typography.captionBold,
                }
              ]}>
                {item.paymentMethod ? item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1) : item.paymentMethod}
              </Text>
            </View>
          )}
        </View>

        {item.timestamp && (
          <Text style={[
            styles.timestamp,
            {
              color: theme.colors.textTertiary,
              ...typography.caption,
              marginTop: spacing.xs,
            }
          ]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Selector */}
      <View style={[
        styles.tabsContainer,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }
      ]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => (
            <AnimatedButton
              key={tab.id}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab.id ? theme.colors.primary : theme.colors.surfaceVariant,
                  borderColor: activeTab === tab.id ? theme.colors.primary : theme.colors.border,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  marginRight: spacing.sm,
                  borderWidth: 1.5,
                }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                library="ionicons"
                size={18}
                color={activeTab === tab.id ? theme.colors.onPrimary : theme.colors.textSecondary}
                style={{ marginRight: spacing.xs }}
              />
              <Text style={[
                styles.tabText,
                {
                  color: activeTab === tab.id ? theme.colors.onPrimary : theme.colors.textSecondary,
                  ...typography.captionBold,
                }
              ]}>
                {tab.label}
              </Text>
              {tab.id === 'pending' && pendingOrders.length > 0 && (
                <View style={[
                  styles.countBadge,
                  {
                    backgroundColor: activeTab === tab.id ? theme.colors.onPrimary + '40' : theme.colors.primary,
                    borderRadius: borderRadius.round,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: 2,
                    marginLeft: spacing.xs,
                  }
                ]}>
                  <Text style={[
                    styles.countText,
                    {
                      color: activeTab === tab.id ? theme.colors.onPrimary : '#FFFFFF',
                      ...typography.captionBold,
                      fontSize: 10,
                    }
                  ]}>
                    {pendingOrders.length}
                  </Text>
                </View>
              )}
            </AnimatedButton>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={currentOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[
          styles.listContent,
          {
            padding: spacing.md,
            paddingBottom: spacing.xxl,
          }
        ]}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        ListEmptyComponent={
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name={activeTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'}
              library="ionicons"
              size={80}
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
              No {activeTab} orders
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
                ? 'Orders will appear here when placed'
                : 'Completed orders will appear here'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    // Styled inline
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    // Typography handled via theme
  },
  countBadge: {
    // Styled inline
  },
  countText: {
    // Typography handled via theme
  },
  listContent: {
    // Padding handled inline
  },
  orderCard: {
    // Styled inline
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderStatus: {
    // Typography handled via theme
  },
  orderId: {
    // Typography handled via theme
  },
  customerName: {
    // Typography handled via theme
  },
  itemsList: {
    // Styled inline
  },
  itemLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    // Typography handled via theme
  },
  addOnsText: {
    // Typography handled via theme
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalAmount: {
    // Typography handled via theme
  },
  paymentBadge: {
    // Styled inline
  },
  paymentMethod: {
    // Typography handled via theme
  },
  timestamp: {
    // Typography handled via theme
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    // Typography handled via theme
  },
  emptySubtext: {
    // Typography handled via theme
  },
});

export default OrderHistoryTabs;

