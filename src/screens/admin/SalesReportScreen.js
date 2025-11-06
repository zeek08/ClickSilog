import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const StatCard = ({ icon, iconColor, title, value, subtitle, theme, spacing, borderRadius, typography }) => (
  <View style={[
    styles.statCard,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1.5,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
      flex: 1,
      minWidth: '45%',
    }
  ]}>
    <View style={[
      styles.statIconContainer,
      {
        backgroundColor: iconColor + '20',
        borderRadius: borderRadius.md,
        width: 48,
        height: 48,
        marginBottom: spacing.sm,
      }
    ]}>
      <Icon
        name={icon}
        library="ionicons"
        size={24}
        color={iconColor}
      />
    </View>
    <Text style={[
      styles.statValue,
      {
        color: theme.colors.text,
        ...typography.h3,
        marginBottom: spacing.xs,
      }
    ]}>
      {value}
    </Text>
    <Text style={[
      styles.statTitle,
      {
        color: theme.colors.textSecondary,
        ...typography.captionBold,
        marginBottom: spacing.xs / 2,
      }
    ]}>
      {title}
    </Text>
    {subtitle && (
      <Text style={[
        styles.statSubtitle,
        {
          color: theme.colors.textTertiary,
          ...typography.caption,
        }
      ]}>
        {subtitle}
      </Text>
    )}
  </View>
);

const SalesReportScreen = () => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
  const [refreshing, setRefreshing] = useState(false);

  const { data: orders, loading } = useRealTimeCollection('orders', [], ['timestamp', 'desc']);

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    const now = new Date();
    let startDate;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        return orders;
    }

    return orders.filter(order => {
      const orderDate = new Date(order.timestamp || order.createdAt || 0);
      return orderDate >= startDate;
    });
  }, [orders, dateFilter]);

  const completedOrders = useMemo(() => 
    filteredOrders.filter(order => order.status === 'completed' || order.status === 'ready'),
    [filteredOrders]
  );

  const totalRevenue = useMemo(() => 
    completedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    [completedOrders]
  );

  const totalOrders = useMemo(() => completedOrders.length, [completedOrders]);

  const averageOrderValue = useMemo(() => 
    totalOrders > 0 ? totalRevenue / totalOrders : 0,
    [totalRevenue, totalOrders]
  );

  const paymentMethodBreakdown = useMemo(() => {
    const breakdown = { cash: 0, gcash: 0 };
    completedOrders.forEach(order => {
      const method = order.paymentMethod || 'cash';
      if (method.toLowerCase() === 'gcash') {
        breakdown.gcash += Number(order.total) || 0;
      } else {
        breakdown.cash += Number(order.total) || 0;
      }
    });
    return breakdown;
  }, [completedOrders]);

  const topItems = useMemo(() => {
    const itemCounts = {};
    completedOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const itemName = item.name || 'Unknown';
        itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 0);
      });
    });
    return Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [completedOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Data will refresh automatically via useRealTimeCollection
    setTimeout(() => setRefreshing(false), 1000);
  };

  const dateFilters = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: '7 Days' },
    { id: 'month', label: '30 Days' },
    { id: 'all', label: 'All Time' },
  ];

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
              name="bar-chart"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[
              styles.headerTitle,
              {
                color: theme.colors.text,
                ...typography.h2,
              }
            ]}>
              Sales Report
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: spacing.md,
            paddingBottom: spacing.xxl,
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Date Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterRow,
            {
              paddingBottom: spacing.md,
              gap: spacing.sm,
            }
          ]}
        >
          {dateFilters.map((filter) => (
            <AnimatedButton
              key={filter.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: dateFilter === filter.id ? theme.colors.primary : theme.colors.surfaceVariant,
                  borderColor: dateFilter === filter.id ? theme.colors.primary : theme.colors.border,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderWidth: 1.5,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: dateFilter === filter.id ? 0.15 : 0.05,
                  shadowRadius: 2,
                  elevation: dateFilter === filter.id ? 2 : 1,
                }
              ]}
              onPress={() => setDateFilter(filter.id)}
            >
              <Text style={[
                styles.filterText,
                {
                  color: dateFilter === filter.id ? theme.colors.onPrimary : theme.colors.text,
                  ...typography.captionBold,
                }
              ]}>
                {filter.label}
              </Text>
            </AnimatedButton>
          ))}
        </ScrollView>

        {/* Stats Cards */}
        <View style={[
          styles.statsRow,
          {
            gap: spacing.md,
            marginBottom: spacing.lg,
          }
        ]}>
          <StatCard
            icon="cash"
            iconColor={theme.colors.success}
            title="Total Revenue"
            value={`₱${totalRevenue.toFixed(2)}`}
            subtitle={`${totalOrders} orders`}
            theme={theme}
            spacing={spacing}
            borderRadius={borderRadius}
            typography={typography}
          />
          <StatCard
            icon="receipt"
            iconColor={theme.colors.primary}
            title="Total Orders"
            value={totalOrders.toString()}
            subtitle={completedOrders.length > 0 ? `${completedOrders.length} completed` : 'No orders'}
            theme={theme}
            spacing={spacing}
            borderRadius={borderRadius}
            typography={typography}
          />
        </View>

        <View style={[
          styles.statsRow,
          {
            gap: spacing.md,
            marginBottom: spacing.lg,
          }
        ]}>
          <StatCard
            icon="trending-up"
            iconColor={theme.colors.info}
            title="Average Order"
            value={`₱${averageOrderValue.toFixed(2)}`}
            subtitle="Per transaction"
            theme={theme}
            spacing={spacing}
            borderRadius={borderRadius}
            typography={typography}
          />
          <StatCard
            icon="card"
            iconColor={theme.colors.warning}
            title="Payment Methods"
            value={`${paymentMethodBreakdown.cash > 0 || paymentMethodBreakdown.gcash > 0 ? '2' : '0'}`}
            subtitle={`Cash: ₱${paymentMethodBreakdown.cash.toFixed(2)}`}
            theme={theme}
            spacing={spacing}
            borderRadius={borderRadius}
            typography={typography}
          />
        </View>

        {/* Payment Method Breakdown */}
        {paymentMethodBreakdown.cash > 0 || paymentMethodBreakdown.gcash > 0 ? (
          <View style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderWidth: 1.5,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }
          ]}>
            <View style={styles.sectionHeader}>
              <Icon
                name="wallet"
                library="ionicons"
                size={24}
                color={theme.colors.primary}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Payment Breakdown
              </Text>
            </View>
            <View style={[
              styles.breakdownRow,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
                paddingBottom: spacing.sm,
                marginBottom: spacing.sm,
              }
            ]}>
              <View style={styles.breakdownItem}>
                <Icon
                  name="cash"
                  library="ionicons"
                  size={20}
                  color={theme.colors.success}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.breakdownLabel,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  Cash
                </Text>
              </View>
              <Text style={[
                styles.breakdownValue,
                {
                  color: theme.colors.text,
                  ...typography.bodyBold,
                }
              ]}>
                ₱{paymentMethodBreakdown.cash.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Icon
                  name="phone-portrait"
                  library="ionicons"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.breakdownLabel,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  GCash
                </Text>
              </View>
              <Text style={[
                styles.breakdownValue,
                {
                  color: theme.colors.text,
                  ...typography.bodyBold,
                }
              ]}>
                ₱{paymentMethodBreakdown.gcash.toFixed(2)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Top Selling Items */}
        {topItems.length > 0 ? (
          <View style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderWidth: 1.5,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }
          ]}>
            <View style={styles.sectionHeader}>
              <Icon
                name="restaurant"
                library="ionicons"
                size={24}
                color={theme.colors.primary}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Top Selling Items
              </Text>
            </View>
            {topItems.map((item, index) => (
              <View
                key={item.name}
                style={[
                  styles.topItemRow,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: index < topItems.length - 1 ? 1 : 0,
                    paddingBottom: spacing.sm,
                    marginBottom: spacing.sm,
                  }
                ]}
              >
                <View style={[
                  styles.rankBadge,
                  {
                    backgroundColor: index === 0 ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderRadius: borderRadius.round,
                    width: 32,
                    height: 32,
                    marginRight: spacing.md,
                  }
                ]}>
                  <Text style={[
                    styles.rankText,
                    {
                      color: index === 0 ? theme.colors.onPrimary : theme.colors.text,
                      ...typography.captionBold,
                    }
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.itemName,
                  {
                    color: theme.colors.text,
                    ...typography.body,
                    flex: 1,
                  }
                ]}>
                  {item.name}
                </Text>
                <Text style={[
                  styles.itemCount,
                  {
                    color: theme.colors.primary,
                    ...typography.bodyBold,
                  }
                ]}>
                  {item.count}x
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Empty State */}
        {completedOrders.length === 0 && !loading && (
          <View style={[
            styles.emptyState,
            {
              padding: spacing.xxl,
            }
          ]}>
            <Icon
              name="bar-chart-outline"
              library="ionicons"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text style={[
              styles.emptyText,
              {
                color: theme.colors.text,
                ...typography.h4,
                marginTop: spacing.lg,
              }
            ]}>
              No Sales Data
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
              {dateFilter === 'today' 
                ? 'No completed orders today'
                : dateFilter === 'week'
                ? 'No completed orders in the last 7 days'
                : dateFilter === 'month'
                ? 'No completed orders in the last 30 days'
                : 'No completed orders found'}
            </Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={[
            styles.emptyState,
            {
              padding: spacing.xxl,
            }
          ]}>
            <Icon
              name="hourglass-outline"
              library="ionicons"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text style={[
              styles.emptyText,
              {
                color: theme.colors.text,
                ...typography.h4,
                marginTop: spacing.lg,
              }
            ]}>
              Loading Sales Data...
            </Text>
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
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    // Typography handled via theme
  },
  content: {
    // Padding handled inline
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    // Styled inline
  },
  filterText: {
    // Typography handled via theme
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    // Styled inline
  },
  statIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    // Typography handled via theme
  },
  statTitle: {
    // Typography handled via theme
  },
  statSubtitle: {
    // Typography handled via theme
  },
  sectionCard: {
    // Styled inline
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    // Typography handled via theme
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    // Typography handled via theme
  },
  breakdownValue: {
    // Typography handled via theme
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankText: {
    // Typography handled via theme
  },
  itemName: {
    // Typography handled via theme
  },
  itemCount: {
    // Typography handled via theme
  },
  emptyState: {
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

export default SalesReportScreen;

