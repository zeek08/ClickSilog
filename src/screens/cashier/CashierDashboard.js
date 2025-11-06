import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { orderService } from '../../services/orderService';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const CashierDashboard = () => {
  const navigation = useNavigation();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsub = orderService.subscribeOrders({ status: 'ready', next: setOrders });
    return () => unsub && unsub();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
        marginHorizontal: spacing.md,
        borderWidth: 1,
      }
    ]}>
      <View style={styles.cardHeader}>
        <View style={[
          styles.orderBadge,
          {
            backgroundColor: theme.colors.primaryContainer,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            borderWidth: 1.5,
            borderColor: theme.colors.primary + '40',
          }
        ]}>
          <Text style={[
            styles.orderId,
            {
              color: theme.colors.primary,
              ...typography.captionBold,
            }
          ]}>
            Order #{item.id?.slice(-5) || '00000'}
          </Text>
        </View>
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
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                {orders.length} ready order{orders.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <ThemeToggle />
        </View>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
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
              No ready orders
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
              Orders will appear here when kitchen marks them as ready
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
  }
});

export default CashierDashboard;

