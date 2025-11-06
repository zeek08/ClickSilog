import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { orderService } from '../../services/orderService';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

const PAGES = [
  { id: 'pending', label: 'Pending' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' }
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
      bg: theme.colors.secondaryLight + '30', 
      color: theme.colors.secondary, 
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
  return (
    <View style={[
      styles.badge, 
      { 
        backgroundColor: s.bg, 
        borderColor: s.color + '40',
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
      }
    ]}>
      <Icon
        name={s.icon}
        library="ionicons"
        size={14}
        color={s.color}
      />
      <Text style={[
        styles.badgeText, 
        { 
          color: s.color,
          ...typography.captionBold,
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
  return `${mins}m ago`;
};

const KDSDashboard = () => {
  const navigation = useNavigation();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [orders, setOrders] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    const unsub = orderService.subscribeOrders({ status: undefined, next: setOrders });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Home');
      return true;
    });
    return () => back.remove();
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const dataByStatus = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'pending' || o.status === 'preparing'),
    ready: orders.filter((o) => o.status === 'ready'),
    completed: orders.filter((o) => o.status === 'completed' || o.status === 'cancelled')
  }), [orders]);

  const startOrReady = async (order) => {
    const next = order.status === 'pending' ? 'preparing' : 'ready';
    await orderService.updateStatus(order.id, next);
  };

  const completeOrder = async (order) => {
    await orderService.updateStatus(order.id, 'completed');
  };

  const cancelOrder = async (order) => {
    await orderService.updateStatus(order.id, 'cancelled');
  };

  const Card = ({ order }) => (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
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
            {order.id?.slice(-5) || '00000'}
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
          gap: spacing.xs,
          marginBottom: spacing.md,
          alignSelf: 'flex-start',
        }
      ]}>
        <Icon
          name="time-outline"
          library="ionicons"
          size={14}
          color={theme.colors.textTertiary}
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
      <View style={styles.itemsBlock}>
        {order.items?.map((i, idx) => (
          <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}>
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
            <View style={{ flex: 1, marginLeft: spacing.md }}>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Icon
                      name="add-circle"
                      library="ionicons"
                      size={12}
                      color={theme.colors.textSecondary}
                    />
                    <Text style={[
                      styles.itemAddOns, 
                      { 
                        color: theme.colors.textSecondary,
                        ...typography.caption,
                      }
                    ]} numberOfLines={1}>
                      {i.addOns.map((a) => a.name).join(', ')}
                    </Text>
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
                    flexDirection: 'row',
                    gap: spacing.xs,
                  }
                ]}>
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
                  ]} numberOfLines={2}>
                    {i.specialInstructions}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
      
      {/* Action buttons at bottom */}
      <View style={[
        styles.footerRow, 
        { 
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          marginTop: spacing.md,
          paddingTop: spacing.md,
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
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    borderWidth: 2,
                    flex: 1,
                  }
                ]} 
                onPress={() => cancelOrder(order)}
              >
                <Icon
                  name="close-circle"
                  library="ionicons"
                  size={16}
                  color={theme.colors.error}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.actionText, 
                  { 
                    color: theme.colors.error,
                    ...typography.bodyBold,
                  }
                ]}>
                  Cancel
                </Text>
              </AnimatedButton>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  { 
                    backgroundColor: theme.colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    flex: 1,
                    shadowColor: theme.colors.primary,
                  }
                ]} 
                onPress={() => startOrReady(order)}
              >
                <Icon
                  name="play"
                  library="ionicons"
                  size={16}
                  color={theme.colors.onPrimary}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.actionText,
                  { 
                    color: theme.colors.onPrimary,
                    ...typography.bodyBold,
                  }
                ]}>
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
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    borderWidth: 2,
                    flex: 1,
                  }
                ]} 
                onPress={() => cancelOrder(order)}
              >
                <Icon
                  name="close-circle"
                  library="ionicons"
                  size={16}
                  color={theme.colors.error}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.actionText, 
                  { 
                    color: theme.colors.error,
                    ...typography.bodyBold,
                  }
                ]}>
                  Cancel
                </Text>
              </AnimatedButton>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  { 
                    backgroundColor: theme.colors.success,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    flex: 1,
                    shadowColor: theme.colors.success,
                  }
                ]} 
                onPress={() => startOrReady(order)}
              >
                <Icon
                  name="checkmark-circle"
                  library="ionicons"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.actionText,
                  { 
                    color: '#FFFFFF',
                    ...typography.bodyBold,
                  }
                ]}>
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
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    borderWidth: 2,
                    flex: 1,
                  }
                ]} 
                onPress={() => cancelOrder(order)}
              >
                <Icon
                  name="close-circle"
                  library="ionicons"
                  size={16}
                  color={theme.colors.error}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.actionText, 
                  { 
                    color: theme.colors.error,
                    ...typography.bodyBold,
                  }
                ]}>
                  Cancel
                </Text>
              </AnimatedButton>
              <AnimatedButton 
                style={[
                  styles.actionBtn, 
                  { 
                    backgroundColor: theme.colors.success,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    flex: 1,
                    shadowColor: theme.colors.success,
                  }
                ]} 
                onPress={() => completeOrder(order)}
              >
                <Icon
                  name="checkmark-done"
                  library="ionicons"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[
                  styles.actionText,
                  { 
                    color: '#FFFFFF',
                    ...typography.bodyBold,
                  }
                ]}>
                  Complete
                </Text>
              </AnimatedButton>
            </>
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
          paddingTop: spacing.xl + spacing.sm,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xs, // Reduced padding
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
        <ThemeToggle />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabs,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.xs, // Reduced top padding
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
                paddingVertical: spacing.xs + 2,
                paddingHorizontal: spacing.md,
                borderWidth: 1.5,
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {PAGES.map((p) => {
          const ordersForPage = dataByStatus[p.id] || [];
          const hasOrders = ordersForPage.length > 0;
          return (
            <View key={p.id} style={{ width, paddingHorizontal: spacing.md }}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  itemsBlock: { marginTop: 4, marginBottom: 12 },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12,
    paddingBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
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
