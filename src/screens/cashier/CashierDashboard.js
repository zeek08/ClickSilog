import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orderService } from '../../services/orderService';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const CashierDashboard = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    // Subscribe to all orders (no status filter) to get both pending_payment and ready orders
    const unsub = orderService.subscribeOrders({ 
      status: undefined, 
      next: setAllOrders 
    });
    return () => unsub && unsub();
  }, []);

  // Filter orders: show pending_payment (awaiting payment) and ready orders
  const orders = useMemo(() => {
    return allOrders.filter(o => 
      o.status === 'pending_payment' || o.status === 'ready'
    );
  }, [allOrders]);

  // Separate awaiting payment and ready orders
  const awaitingPaymentOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending_payment');
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders.filter(o => o.status === 'ready');
  }, [orders]);

  const renderItem = ({ item, isAwaitingPayment = false }) => (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: isAwaitingPayment ? theme.colors.warning : theme.colors.border,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
        marginHorizontal: spacing.md,
        borderWidth: isAwaitingPayment ? 2 : 1,
      }
    ]}>
      <View style={styles.cardHeader}>
        <View style={[
          styles.orderBadge,
          {
            backgroundColor: isAwaitingPayment 
              ? theme.colors.warning + '20' 
              : theme.colors.primaryContainer,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            borderWidth: 1.5,
            borderColor: isAwaitingPayment 
              ? theme.colors.warning + '40' 
              : theme.colors.primary + '40',
          }
        ]}>
          <Text style={[
            styles.orderId,
            {
              color: isAwaitingPayment ? theme.colors.warning : theme.colors.primary,
              ...typography.captionBold,
            }
          ]}>
            Order #{item.id || 'N/A'}
          </Text>
        </View>
        {isAwaitingPayment && (
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: theme.colors.warning + '20',
              borderRadius: borderRadius.sm,
              paddingVertical: spacing.xs / 2,
              paddingHorizontal: spacing.xs,
              borderWidth: 1,
              borderColor: theme.colors.warning + '40',
              marginLeft: spacing.sm,
            }
          ]}>
            <Icon
              name="time"
              library="ionicons"
              size={12}
              color={theme.colors.warning}
              style={{ marginRight: spacing.xs / 2 }}
              responsive={false}
              hitArea={false}
            />
            <Text style={[
              styles.statusText,
              {
                color: theme.colors.warning,
                fontSize: 11,
                fontWeight: '600',
              }
            ]}>
              Awaiting Payment
            </Text>
          </View>
        )}
        {item.tableNumber && (
          <Text style={[
            styles.tableNumber,
            {
              color: theme.colors.textSecondary,
              ...typography.caption,
              marginLeft: spacing.sm,
            }
          ]}>
            Table {item.tableNumber}
          </Text>
        )}
      </View>
      <Text style={[
        styles.title, 
        { 
          color: theme.colors.text,
          ...typography.bodyBold,
          marginTop: spacing.sm,
          marginBottom: spacing.sm,
        }
      ]} numberOfLines={2}>
        {item.items?.map((i) => `${i.quantity || i.qty}x ${i.name}`).join(', ')}
      </Text>
      <View style={[
        styles.totalContainer,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          marginBottom: spacing.md,
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
          styles.meta, 
          { 
            color: theme.colors.primary,
            ...typography.h4,
          }
        ]}>
          ₱{Number(item.total || 0).toFixed(2)}
        </Text>
      </View>
      {!isAwaitingPayment && (
        <AnimatedButton
          style={[
            styles.btn, 
            { 
              backgroundColor: theme.colors.primary,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              shadowColor: theme.colors.primary,
            }
          ]}
          onPress={() => navigation.navigate('CashierPayment', { order: item })}
        >
          <Icon
            name="card"
            library="ionicons"
            size={20}
            color={theme.colors.onPrimary}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[
            styles.btnText,
            {
              color: theme.colors.onPrimary,
              ...typography.bodyBold,
            }
          ]}>
            Take Cash Payment
          </Text>
        </AnimatedButton>
      )}
    </View>
  );

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
            <Icon
              name="card"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: spacing.sm }}
            />
            <View>
              <Text style={[
                styles.headerTitle,
                {
                  color: theme.colors.text,
                  ...typography.h2,
                }
              ]}>
                Cashier
              </Text>
              <Text style={[
                styles.headerSubtitle,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                {awaitingPaymentOrders.length} awaiting payment • {readyOrders.length} ready
              </Text>
            </View>
          </View>
          <ThemeToggle />
        </View>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => renderItem({ 
          item, 
          isAwaitingPayment: item.status === 'pending_payment' 
        })}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        ListEmptyComponent={
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name="receipt-outline"
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
              No orders
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
              Orders awaiting payment or ready for pickup will appear here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    // Margin handled inline
  },
  headerSubtitle: {
    // Typography handled via theme
  },
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeader: {
    // Margin handled inline
  },
  orderBadge: {
    alignSelf: 'flex-start'
  },
  orderId: {
    // Typography handled via theme
  },
  title: {
    // Typography handled via theme
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  meta: {
    // Typography handled via theme
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  btnText: {
    // Typography handled via theme
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    // Typography handled via theme
  },
  emptySubtext: {
    // Typography handled via theme
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    // Typography handled inline
  },
  tableNumber: {
    // Typography handled inline
  }
});

export default CashierDashboard;

