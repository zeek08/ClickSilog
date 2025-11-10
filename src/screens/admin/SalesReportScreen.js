import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

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
    <View
      style={{
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
      }}
    >
      <View
        style={{
          backgroundColor: hexToRgba(iconColor, 0.1), // Soft 10% opacity halo
          borderWidth: 1.5,
          borderColor: iconColor + '40',
          padding: spacing.xs,
          borderRadius: 999, // Perfect circle
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: iconColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
      <Icon
        name={icon}
        library="ionicons"
        size={24}
        color={iconColor}
        responsive={true}
        hitArea={false}
      />
      </View>
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
  const [refreshing, setRefreshing] = useState(false);

  const { data: orders, loading } = useRealTimeCollection('orders', [], ['timestamp', 'desc']);

  const filteredOrders = useMemo(() => {
    try {
      if (!orders || !Array.isArray(orders) || orders.length === 0) return [];
      
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
        try {
          if (!order) return false;
          const orderDate = new Date(order.timestamp || order.createdAt || 0);
          if (isNaN(orderDate.getTime())) return false;
          return orderDate >= startDate;
        } catch (e) {
          return false;
        }
      });
    } catch (e) {
      console.error('Error filtering orders:', e);
      return [];
    }
  }, [orders, dateFilter]);

  const completedOrders = useMemo(() => {
    try {
      if (!filteredOrders || !Array.isArray(filteredOrders)) return [];
      return filteredOrders.filter(order => order && (order.status === 'completed' || order.status === 'ready'));
    } catch (e) {
      console.error('Error filtering completed orders:', e);
      return [];
    }
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => 
    filteredOrders.filter(order => order.status === 'cancelled'),
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

  // Enhanced: Popular items analysis with revenue
  const topItems = useMemo(() => {
    const itemStats = {};
    completedOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const itemName = item.name || 'Unknown';
        const quantity = item.quantity || item.qty || 0;
        const price = Number(item.price || item.totalItemPrice || 0);
        const revenue = price * quantity;
        
        if (!itemStats[itemName]) {
          itemStats[itemName] = {
            name: itemName,
            count: 0,
            revenue: 0,
            quantity: 0,
          };
        }
        itemStats[itemName].count += 1; // Number of times ordered
        itemStats[itemName].quantity += quantity; // Total quantity sold
        itemStats[itemName].revenue += revenue; // Total revenue from this item
      });
    });
    return Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity) // Sort by quantity sold
      .slice(0, 10); // Top 10 items
  }, [completedOrders]);

  // Analytics: Daily revenue trend (last 7 days)
  const dailyRevenue = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayRevenue = completedOrders
        .filter(order => {
          const orderDate = new Date(order.timestamp || order.createdAt || 0);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === date.getTime();
        })
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
      
      days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayRevenue,
      });
    }
    
    // Calculate max revenue for percentage calculation
    const maxRevenue = Math.max(...days.map(d => d.revenue), 1);
    
    // Add percentage to each day (capped at 100%)
    return days.map(day => ({
      ...day,
      percentage: maxRevenue > 0 ? Math.min((day.revenue / maxRevenue) * 100, 100) : 0,
    }));
  }, [completedOrders]);

  // Enhanced: Hourly order distribution with revenue
  const hourlyOrders = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ 
      hour: i, 
      count: 0, 
      revenue: 0,
      avgOrderValue: 0,
    }));
    completedOrders.forEach(order => {
      const orderDate = new Date(order.timestamp || order.createdAt || 0);
      const hour = orderDate.getHours();
      const orderTotal = Number(order.total || 0);
      hours[hour].count++;
      hours[hour].revenue += orderTotal;
    });
    // Calculate average order value per hour
    hours.forEach(h => {
      h.avgOrderValue = h.count > 0 ? h.revenue / h.count : 0;
    });
    const maxCount = Math.max(...hours.map(h => h.count), 1);
    const maxRevenue = Math.max(...hours.map(h => h.revenue), 1);
    return hours.map(h => ({
      ...h,
      percentage: maxCount > 0 ? (h.count / maxCount) * 100 : 0,
      revenuePercentage: maxRevenue > 0 ? (h.revenue / maxRevenue) * 100 : 0,
    }));
  }, [completedOrders]);

  // Enhanced: Revenue trends over time (weekly and monthly)
  const revenueTrends = useMemo(() => {
    try {
      const now = new Date();
      const trends = {
        weekly: [],
        monthly: [],
      };
      
      // Weekly trend (last 4 weeks)
      for (let i = 3; i >= 0; i--) {
        try {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          if (isNaN(weekStart.getTime()) || isNaN(weekEnd.getTime())) {
            continue;
          }
          
          const weekRevenue = completedOrders
            .filter(order => {
              try {
                const orderDate = new Date(order.timestamp || order.createdAt || 0);
                return !isNaN(orderDate.getTime()) && orderDate >= weekStart && orderDate <= weekEnd;
              } catch (e) {
                return false;
              }
            })
            .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
          
          trends.weekly.push({
            period: `Week ${4 - i}`,
            revenue: weekRevenue,
            startDate: weekStart,
          });
        } catch (e) {
          console.error('Error calculating weekly trend:', e);
        }
      }
      
      // Monthly trend (last 6 months)
      for (let i = 5; i >= 0; i--) {
        try {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthStart.setHours(0, 0, 0, 0);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          
          if (isNaN(monthStart.getTime()) || isNaN(monthEnd.getTime())) {
            continue;
          }
          
          const monthRevenue = completedOrders
            .filter(order => {
              try {
                const orderDate = new Date(order.timestamp || order.createdAt || 0);
                return !isNaN(orderDate.getTime()) && orderDate >= monthStart && orderDate <= monthEnd;
              } catch (e) {
                return false;
              }
            })
            .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
          
          trends.monthly.push({
            period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            revenue: monthRevenue,
            startDate: monthStart,
          });
        } catch (e) {
          console.error('Error calculating monthly trend:', e);
        }
      }
      
      return trends;
    } catch (e) {
      console.error('Error in revenueTrends calculation:', e);
      return { weekly: [], monthly: [] };
    }
  }, [completedOrders]);

  // Enhanced: Customer behavior insights
  const customerInsights = useMemo(() => {
    try {
      const insights = {
        averageOrderValue: averageOrderValue || 0,
        averageItemsPerOrder: 0,
        peakOrderDay: null,
        peakOrderHour: null,
        repeatCustomers: 0,
        newCustomers: 0,
        averageOrderTime: 0, // Time from order to completion
      };
      
      if (!completedOrders || completedOrders.length === 0) return insights;
      
      try {
        // Average items per order
        const totalItems = completedOrders.reduce((sum, order) => {
          return sum + ((order.items || []).length || 0);
        }, 0);
        insights.averageItemsPerOrder = totalItems / completedOrders.length;
      } catch (e) {
        console.error('Error calculating average items per order:', e);
      }
      
      try {
        // Peak order day
        const dayCounts = {};
        completedOrders.forEach(order => {
          try {
            const orderDate = new Date(order.timestamp || order.createdAt || 0);
            if (!isNaN(orderDate.getTime())) {
              const dayName = orderDate.toLocaleDateString('en-US', { weekday: 'long' });
              dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
            }
          } catch (e) {
            // Skip invalid dates
          }
        });
        const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
        insights.peakOrderDay = peakDay ? peakDay[0] : null;
      } catch (e) {
        console.error('Error calculating peak order day:', e);
      }
      
      try {
        // Peak order hour
        if (hourlyOrders && hourlyOrders.length > 0) {
          const sortedHours = [...hourlyOrders].sort((a, b) => (b.count || 0) - (a.count || 0));
          const peakHour = sortedHours.length > 0 ? sortedHours[0] : null;
          insights.peakOrderHour = peakHour && peakHour.count > 0 ? peakHour.hour : null;
        }
      } catch (e) {
        console.error('Error calculating peak order hour:', e);
      }
      
      try {
        // Average order time (from order to completion)
        const orderTimes = completedOrders
          .filter(order => {
            try {
              return order.timestamp && order.completedTime;
            } catch (e) {
              return false;
            }
          })
          .map(order => {
            try {
              const orderTime = new Date(order.timestamp || order.createdAt || 0).getTime();
              const completedTime = new Date(order.completedTime || order.updatedAt || 0).getTime();
              if (isNaN(orderTime) || isNaN(completedTime) || completedTime <= orderTime) {
                return null;
              }
              return completedTime - orderTime; // Time in milliseconds
            } catch (e) {
              return null;
            }
          })
          .filter(time => time !== null && time > 0);
        
        if (orderTimes.length > 0) {
          const avgTimeMs = orderTimes.reduce((sum, time) => sum + time, 0) / orderTimes.length;
          insights.averageOrderTime = Math.round(avgTimeMs / (1000 * 60)); // Convert to minutes
        }
      } catch (e) {
        console.error('Error calculating average order time:', e);
      }
      
      try {
        // Customer tracking (by table number or customer name)
        const customerOrders = {};
        completedOrders.forEach(order => {
          try {
            const customerId = order.tableNumber || order.customerName || order.userId || 'unknown';
            if (!customerOrders[customerId]) {
              customerOrders[customerId] = 0;
            }
            customerOrders[customerId]++;
          } catch (e) {
            // Skip invalid orders
          }
        });
        
        const customerCounts = Object.values(customerOrders);
        insights.repeatCustomers = customerCounts.filter(count => count > 1).length;
        insights.newCustomers = customerCounts.filter(count => count === 1).length;
      } catch (e) {
        console.error('Error calculating customer tracking:', e);
      }
      
      return insights;
    } catch (e) {
      console.error('Error in customerInsights calculation:', e);
      return {
        averageOrderValue: 0,
        averageItemsPerOrder: 0,
        peakOrderDay: null,
        peakOrderHour: null,
        repeatCustomers: 0,
        newCustomers: 0,
        averageOrderTime: 0,
      };
    }
  }, [completedOrders, averageOrderValue, hourlyOrders]);

  // Enhanced: Profit margin calculations (if cost data available)
  const profitAnalysis = useMemo(() => {
    try {
      // Note: This requires menu items to have cost data
      // For now, we'll calculate estimated profit based on a default margin
      const defaultMargin = 0.30; // 30% default margin assumption
      const revenue = Number(totalRevenue) || 0;
      const totalCost = revenue * (1 - defaultMargin);
      const estimatedProfit = revenue - totalCost;
      const profitMargin = revenue > 0 ? (estimatedProfit / revenue) * 100 : 0;
      
      return {
        totalRevenue: revenue,
        estimatedCost: totalCost,
        estimatedProfit,
        profitMargin,
        note: 'Based on 30% default margin. Update menu items with actual cost data for accurate calculations.',
      };
    } catch (e) {
      console.error('Error in profitAnalysis calculation:', e);
      return {
        totalRevenue: 0,
        estimatedCost: 0,
        estimatedProfit: 0,
        profitMargin: 0,
        note: 'Error calculating profit analysis.',
      };
    }
  }, [totalRevenue]);

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
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <AnimatedButton
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: 'transparent',
                marginRight: spacing.sm,
              }}
            >
              <View
                style={{
                  backgroundColor: hexToRgba(theme.colors.error, 0.1),
                  borderWidth: 1.5,
                  borderColor: theme.colors.error + '40',
                  padding: spacing.sm,
                  borderRadius: 999,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.error,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Icon
                  name="arrow-back"
                  library="ionicons"
                  size={22}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </AnimatedButton>
            <Icon
              name="bar-chart"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              responsive={true}
              hitArea={false}
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

        {/* Cancelled Orders Card */}
        {cancelledOrders.length > 0 && (
          <View style={[
            styles.statsRow,
            {
              gap: spacing.md,
              marginBottom: spacing.lg,
            }
          ]}>
            <StatCard
              icon="close-circle"
              iconColor={theme.colors.error}
              title="Cancelled Orders"
              value={cancelledOrders.length.toString()}
              subtitle={`${cancelledOrders.length} order${cancelledOrders.length !== 1 ? 's' : ''} cancelled`}
              theme={theme}
              spacing={spacing}
              borderRadius={borderRadius}
              typography={typography}
            />
          </View>
        )}

        {/* Daily Revenue Trend Chart */}
        {dailyRevenue.length > 0 && (
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
                name="trending-up"
                library="ionicons"
                size={24}
                color={theme.colors.info}
                responsive={true}
                hitArea={false}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Daily Revenue Trend
              </Text>
            </View>
            <View style={[
              styles.chartContainer,
              {
                marginTop: spacing.md,
                paddingBottom: spacing.sm,
                overflow: 'hidden',
              }
            ]}>
              <View style={[styles.chartBars, { height: 120, maxHeight: 120, overflow: 'hidden' }]}>
                {dailyRevenue.map((day, index) => (
                  <View key={index} style={[styles.chartBarContainer, { flex: 1, minWidth: 0 }]}>
                    <View style={[styles.chartBarWrapper, { height: 120, maxHeight: 120, overflow: 'hidden' }]}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${Math.min(day.percentage, 100)}%`,
                            maxHeight: 120,
                            backgroundColor: theme.colors.primary,
                            borderRadius: borderRadius.sm,
                            minHeight: day.revenue > 0 ? 4 : 0,
                          }
                        ]}
                      />
                    </View>
                    <Text style={[
                      styles.chartLabel,
                      {
                        color: theme.colors.textSecondary,
                        ...typography.caption,
                        marginTop: spacing.xs,
                        fontSize: 10,
                      }
                    ]} numberOfLines={1}>
                      {day.date}
                    </Text>
                    {day.revenue > 0 && (
                      <Text style={[
                        styles.chartValue,
                        {
                          color: theme.colors.text,
                          ...typography.captionBold,
                          fontSize: 9,
                          marginTop: 2,
                        }
                      ]} numberOfLines={1}>
                        ₱{day.revenue.toFixed(0)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Hourly Order Distribution */}
        {hourlyOrders.some(h => h.count > 0) && (
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
                name="time"
                library="ionicons"
                size={24}
                color={theme.colors.secondary}
                responsive={true}
                hitArea={false}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Peak Hours Analysis
              </Text>
            </View>
            <View style={[
              styles.chartContainer,
              {
                marginTop: spacing.md,
              }
            ]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.chartBars, { alignItems: 'flex-end' }]}>
                  {hourlyOrders.map((hour, index) => (
                    <View key={index} style={[styles.chartBarContainer, { minWidth: 50, marginHorizontal: 2, flexDirection: 'column', justifyContent: 'flex-start' }]}>
                      {/* Hour label at the top */}
                      <Text style={[
                        styles.chartLabel,
                        {
                          color: theme.colors.textSecondary,
                          ...typography.caption,
                          fontSize: 10,
                          marginBottom: spacing.sm,
                        }
                      ]}>
                        {hour.hour}h
                      </Text>
                      {/* Bar with values inside */}
                      <View style={[styles.chartBarWrapper, { height: 120, maxHeight: 120, position: 'relative' }]}>
                        <View
                          style={[
                            styles.chartBar,
                            {
                              height: `${hour.percentage}%`,
                              maxHeight: '100%',
                              backgroundColor: hour.count > 0 ? (theme.colors.success + '20') : 'transparent',
                              borderColor: hour.count > 0 ? theme.colors.success : theme.colors.border,
                              borderWidth: 2,
                              borderRadius: borderRadius.sm,
                              minHeight: hour.count > 0 ? 4 : 0,
                              justifyContent: 'center',
                              alignItems: 'center',
                              position: 'relative',
                            }
                          ]}
                        >
                          {/* Values inside the bar */}
                          {hour.count > 0 && (
                            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                              <Text style={[
                                styles.chartValue,
                                {
                                  color: theme.colors.text,
                                  ...typography.captionBold,
                                  fontSize: 9,
                                  marginBottom: 2,
                                }
                              ]}>
                                {hour.count}
                              </Text>
                              {hour.revenue > 0 && (
                                <Text style={[
                                  styles.chartValue,
                                  {
                                    color: theme.colors.success,
                                    ...typography.captionBold,
                                    fontSize: 8,
                                  }
                                ]}>
                                  ₱{hour.revenue.toFixed(0)}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

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
                responsive={true}
                hitArea={false}
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
            <View style={{ marginTop: spacing.md }}>
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
                    responsive={true}
                    hitArea={false}
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
                    responsive={true}
                    hitArea={false}
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
                responsive={true}
                hitArea={false}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Popular Items Analysis
              </Text>
            </View>
            <View style={{ marginTop: spacing.md }}>
              {topItems.slice(0, 5).map((item, index) => (
                <View
                  key={item.name}
                  style={[
                    styles.topItemRow,
                    {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index < Math.min(topItems.length, 5) - 1 ? 1 : 0,
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
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.itemName,
                    {
                      color: theme.colors.text,
                      ...typography.body,
                    }
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={[
                    styles.itemSubtext,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.caption,
                      marginTop: spacing.xs / 2,
                    }
                  ]}>
                    {item.quantity}x sold • {item.count} orders • ₱{item.revenue.toFixed(2)} revenue
                  </Text>
                </View>
              </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Enhanced: Revenue Trends */}
        {revenueTrends && revenueTrends.weekly && revenueTrends.weekly.length > 0 && (
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
                name="trending-up"
                library="ionicons"
                size={24}
                color={theme.colors.success}
                responsive={true}
                hitArea={false}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Weekly Revenue Trend
              </Text>
            </View>
            <View style={{ marginTop: spacing.md }}>
              {revenueTrends.weekly.map((week, index) => {
                const maxRevenue = Math.max(...(revenueTrends.weekly || []).map(w => w.revenue || 0), 1);
                const percentage = maxRevenue > 0 ? (week.revenue / maxRevenue) * 100 : 0;
                return (
                  <View key={index} style={[
                    styles.trendRow,
                    {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index < (revenueTrends.weekly?.length || 0) - 1 ? 1 : 0,
                      paddingBottom: spacing.sm,
                      marginBottom: spacing.sm,
                    }
                  ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.trendLabel,
                        {
                          color: theme.colors.text,
                          ...typography.bodyBold,
                        }
                      ]}>
                        {week.period}
                      </Text>
                      <View style={[
                        styles.trendBarContainer,
                        {
                          backgroundColor: theme.colors.surfaceVariant,
                          borderRadius: borderRadius.sm,
                          height: 8,
                          marginTop: spacing.xs,
                          overflow: 'hidden',
                        }
                      ]}>
                        <View style={[
                          styles.trendBar,
                          {
                            width: `${percentage}%`,
                            backgroundColor: theme.colors.success,
                            height: '100%',
                            borderRadius: borderRadius.sm,
                          }
                        ]} />
                      </View>
                    </View>
                    <Text style={[
                      styles.trendValue,
                      {
                        color: theme.colors.success,
                        ...typography.bodyBold,
                        marginLeft: spacing.md,
                      }
                    ]}>
                      ₱{week.revenue.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Enhanced: Customer Behavior Insights */}
        {customerInsights && completedOrders.length > 0 && (
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
                name="people"
                library="ionicons"
                size={24}
                color={theme.colors.info}
                responsive={true}
                hitArea={false}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Customer Insights
              </Text>
            </View>
            <View style={{ marginTop: spacing.md }}>
              <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                <Text style={[
                  styles.insightLabel,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  Avg Items per Order
                </Text>
                <Text style={[
                  styles.insightValue,
                  {
                    color: theme.colors.text,
                    ...typography.bodyBold,
                  }
                ]}>
                  {(customerInsights?.averageItemsPerOrder || 0).toFixed(1)}
                </Text>
              </View>
              {customerInsights?.peakOrderDay && (
                <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                  <Text style={[
                    styles.insightLabel,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.body,
                    }
                  ]}>
                    Peak Order Day
                  </Text>
                  <Text style={[
                    styles.insightValue,
                    {
                      color: theme.colors.text,
                      ...typography.bodyBold,
                    }
                  ]}>
                    {customerInsights?.peakOrderDay}
                  </Text>
                </View>
              )}
              {customerInsights?.peakOrderHour !== null && customerInsights?.peakOrderHour !== undefined && (
                <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                  <Text style={[
                    styles.insightLabel,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.body,
                    }
                  ]}>
                    Peak Order Hour
                  </Text>
                  <Text style={[
                    styles.insightValue,
                    {
                      color: theme.colors.text,
                      ...typography.bodyBold,
                    }
                  ]}>
                    {customerInsights?.peakOrderHour}:00
                  </Text>
                </View>
              )}
              {customerInsights?.averageOrderTime > 0 && (
                <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                  <Text style={[
                    styles.insightLabel,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.body,
                    }
                  ]}>
                    Avg Order Time
                  </Text>
                  <Text style={[
                    styles.insightValue,
                    {
                      color: theme.colors.text,
                      ...typography.bodyBold,
                    }
                  ]}>
                    {customerInsights?.averageOrderTime} min
                  </Text>
                </View>
              )}
              {customerInsights?.repeatCustomers > 0 && (
                <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                  <Text style={[
                    styles.insightLabel,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.body,
                    }
                  ]}>
                    Repeat Customers
                  </Text>
                  <Text style={[
                    styles.insightValue,
                    {
                      color: theme.colors.success,
                      ...typography.bodyBold,
                    }
                  ]}>
                    {customerInsights?.repeatCustomers}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Enhanced: Profit Analysis */}
        {profitAnalysis && totalRevenue > 0 && (
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
                name="cash"
                library="ionicons"
                size={24}
                color={theme.colors.success}
                responsive={true}
                hitArea={false}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Profit Analysis
              </Text>
            </View>
            <View style={{ marginTop: spacing.md }}>
              <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                <Text style={[
                  styles.insightLabel,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  Total Revenue
                </Text>
                <Text style={[
                  styles.insightValue,
                  {
                    color: theme.colors.text,
                    ...typography.bodyBold,
                  }
                ]}>
                  ₱{(profitAnalysis?.totalRevenue || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                <Text style={[
                  styles.insightLabel,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  Estimated Cost
                </Text>
                <Text style={[
                  styles.insightValue,
                  {
                    color: theme.colors.text,
                    ...typography.body,
                  }
                ]}>
                  ₱{(profitAnalysis?.estimatedCost || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                <Text style={[
                  styles.insightLabel,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  Estimated Profit
                </Text>
                <Text style={[
                  styles.insightValue,
                  {
                    color: theme.colors.success,
                    ...typography.bodyBold,
                  }
                ]}>
                  ₱{(profitAnalysis?.estimatedProfit || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.insightRow, { marginBottom: spacing.sm }]}>
                <Text style={[
                  styles.insightLabel,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.body,
                  }
                ]}>
                  Profit Margin
                </Text>
                <Text style={[
                  styles.insightValue,
                  {
                    color: theme.colors.success,
                    ...typography.bodyBold,
                  }
                ]}>
                  {(profitAnalysis?.profitMargin || 0).toFixed(1)}%
                </Text>
              </View>
              <Text style={[
                styles.profitNote,
                {
                  color: theme.colors.textTertiary,
                  ...typography.caption,
                  marginTop: spacing.sm,
                  fontStyle: 'italic',
                }
              ]}>
                {profitAnalysis?.note || 'Error calculating profit analysis.'}
              </Text>
            </View>
          </View>
        )}

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
              responsive={true}
              hitArea={false}
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
              responsive={true}
              hitArea={false}
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
  chartContainer: {
    width: '100%',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 2,
    width: '100%',
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
    maxWidth: '100%',
  },
  chartBarWrapper: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '80%',
    maxWidth: 40,
  },
  chartLabel: {
    textAlign: 'center',
  },
  chartValue: {
    textAlign: 'center',
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendLabel: {
    // Typography handled via theme
  },
  trendBarContainer: {
    // Styled inline
  },
  trendBar: {
    // Styled inline
  },
  trendValue: {
    // Typography handled via theme
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    // Typography handled via theme
  },
  insightValue: {
    // Typography handled via theme
  },
  itemSubtext: {
    // Typography handled via theme
  },
  profitNote: {
    // Typography handled via theme
  },
});

export default SalesReportScreen;

