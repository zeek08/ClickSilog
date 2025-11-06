import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Dimensions, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { orderService } from '../../services/orderService';
import CategoryFilter from '../../components/ui/CategoryFilter';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import OrderSummary from '../../components/cashier/OrderSummary';
import PaymentControls from '../../components/cashier/PaymentControls';
import OrderHistoryTabs from '../../components/cashier/OrderHistoryTabs';
import ItemCustomizationModal from '../../components/ui/ItemCustomizationModal';

const { width } = Dimensions.get('window');

const CashierOrderingScreen = () => {
  const navigation = useNavigation();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { items, total, clearCart, addToCart, calculateTotalPrice } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [quickAddItem, setQuickAddItem] = useState(null);
  const scrollRef = useRef(null);
  const cartCount = items.reduce((n, i) => n + (i.qty || 0), 0);

  const { data: categories, loading: categoriesLoading } = useRealTimeCollection('menu_categories', [['active', '==', true]], ['sortOrder', 'asc']);
  const { data: menuItems, loading: itemsLoading } = useRealTimeCollection('menu', [['available', '==', true]], ['name', 'asc']);

  const pages = useMemo(() => [{ id: 'all', name: 'All' }, ...(categories || [])], [categories]);
  const pageIndex = useMemo(() => {
    if (!selectedCategory) return 0;
    const i = pages.findIndex((p) => p.id === selectedCategory);
    return Math.max(0, i);
  }, [selectedCategory, pages]);

  const filterByCategory = (catId) => (catId && catId !== 'all') ? menuItems.filter((i) => i.categoryId === catId) : menuItems;

  const onSelectCategory = (catId) => {
    setSelectedCategory(catId);
    const i = catId ? pages.findIndex((p) => p.id === catId) : 0;
    if (scrollRef.current) scrollRef.current.scrollTo({ x: width * (i < 0 ? 0 : i), animated: true });
  };

  const onMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    const page = pages[i];
    if (page) setSelectedCategory(page.id === 'all' ? null : page.id);
  };

  const filteredBySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((m) => m.name?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
  }, [menuItems, search]);


  if (categoriesLoading || itemsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
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
                Cashier POS
              </Text>
              <Text style={[
                styles.headerSubtitle,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                Quick add items to cart
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle style={{ marginRight: spacing.sm }} />
            <AnimatedButton
              style={[
                styles.cartButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.round,
                  width: 44,
                  height: 44,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 3,
                  position: 'relative',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0,
                }
              ]}
              onPress={() => navigation.navigate('CashierPayment')}
            >
              <Icon
                name="cart"
                library="ionicons"
                size={22}
                color={theme.colors.onPrimary}
                style={{ margin: 0, padding: 0 }}
              />
              {cartCount > 0 && (
                <View style={[
                  styles.cartBadge,
                  {
                    backgroundColor: theme.colors.error,
                    borderRadius: borderRadius.round,
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 6,
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: theme.colors.surface,
                  }
                ]}>
                  <Text style={[
                    styles.cartBadgeText,
                    {
                      color: '#FFFFFF',
                      ...typography.captionBold,
                      fontSize: 11,
                    }
                  ]}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </AnimatedButton>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.orderingContent}>
          {/* Search Bar */}
          <View style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surface,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }
          ]}>
            {searchOpen ? (
              <View style={[
                styles.searchWrap,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primary + '40',
                  borderRadius: borderRadius.lg,
                  borderWidth: 2,
                  paddingHorizontal: spacing.md,
                  height: 44,
                }
              ]}>
                <Icon
                  name="search"
                  library="ionicons"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={{ marginRight: spacing.sm }}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search menu items..."
                  placeholderTextColor={theme.colors.textTertiary}
                  autoFocus
                  style={[
                    styles.searchInput,
                    {
                      color: theme.colors.text,
                      flex: 1,
                      ...typography.body,
                    }
                  ]}
                />
                <AnimatedButton
                  onPress={() => { setSearchOpen(false); setSearch(''); }}
                  style={[
                    styles.searchCancel,
                    {
                      backgroundColor: theme.colors.errorLight,
                      borderRadius: borderRadius.round,
                      width: 32,
                      height: 32,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }
                  ]}
                >
                  <Icon
                    name="close"
                    library="ionicons"
                    size={18}
                    color={theme.colors.error}
                    style={{ margin: 0 }}
                  />
                </AnimatedButton>
              </View>
            ) : (
              <AnimatedButton
                onPress={() => setSearchOpen(true)}
                style={[
                  styles.searchButton,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: spacing.md,
                    height: 44,
                    flex: 1,
                  }
                ]}
              >
                <Icon
                  name="search"
                  library="ionicons"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={[
                  styles.searchPlaceholder,
                  {
                    color: theme.colors.textTertiary,
                    ...typography.body,
                  }
                ]}>
                  Search menu items...
                </Text>
              </AnimatedButton>
            )}
          </View>

          {/* Category Filter */}
          <CategoryFilter
            categories={pages}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />

          {/* Quick Add Buttons - All Items */}
          <ScrollView
            style={styles.quickAddScroll}
            contentContainerStyle={[
              styles.quickAddContent,
              {
                padding: spacing.md,
                paddingBottom: 200, // Space for floating summary
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {filteredBySearch.length === 0 ? (
              <View style={[styles.empty, { padding: spacing.xxl }]}>
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
                  No items found
                </Text>
              </View>
            ) : (
              <View style={styles.quickAddGrid}>
                {filteredBySearch.map((item) => (
                  <AnimatedButton
                    key={item.id}
                    style={[
                      styles.quickAddBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: borderRadius.lg,
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                        borderWidth: 1.5,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    ]}
                    onPress={() => setQuickAddItem(item)}
                  >
                    <View style={styles.quickAddBtnContent}>
                      <View style={[
                        styles.quickAddIconContainer,
                        {
                          backgroundColor: theme.colors.primaryContainer,
                          borderRadius: borderRadius.round,
                          width: 48,
                          height: 48,
                          marginBottom: spacing.sm,
                        }
                      ]}>
                        <Icon
                          name="restaurant"
                          library="ionicons"
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                      <Text style={[
                        styles.quickAddText,
                        {
                          color: theme.colors.text,
                          ...typography.bodyBold,
                          marginBottom: spacing.xs,
                          textAlign: 'center',
                        }
                      ]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={[
                        styles.quickAddPrice,
                        {
                          color: theme.colors.primary,
                          ...typography.h4,
                        }
                      ]}>
                        ₱{Number(item.price || 0).toFixed(2)}
                      </Text>
                    </View>
                  </AnimatedButton>
                ))}
              </View>
            )}
          </ScrollView>
        </View>


      {/* Quick Add Modal */}
      {quickAddItem && (
        <ItemCustomizationModal
          visible={!!quickAddItem}
          onClose={() => setQuickAddItem(null)}
          item={quickAddItem}
          onConfirm={({ qty, selectedAddOns, specialInstructions }) => {
            addToCart(quickAddItem, { qty, selectedAddOns, specialInstructions });
            setQuickAddItem(null);
          }}
          calculateTotalPrice={calculateTotalPrice}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    // Typography handled via theme
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
  headerSubtitle: {
    // Typography handled via theme
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
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
  orderingContent: {
    flex: 1,
  },
  searchContainer: {
    // Styled inline
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    // Typography handled via theme
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchPlaceholder: {
    // Typography handled via theme
  },
  searchCancel: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cartButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  cartBadge: {
    // Styled inline
  },
  cartBadgeText: {
    // Typography handled via theme
  },
  quickAddScroll: {
    flex: 1,
  },
  quickAddContent: {
    // Padding handled inline
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAddBtn: {
    width: '48%',
    minWidth: 150,
  },
  quickAddBtnContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAddText: {
    // Typography handled via theme
  },
  quickAddPrice: {
    // Typography handled via theme
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    // Typography handled via theme
  },
});

export default CashierOrderingScreen;

