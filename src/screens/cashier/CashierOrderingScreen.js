import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Dimensions, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import CategoryFilter from '../../components/ui/CategoryFilter';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import OrderSummary from '../../components/cashier/OrderSummary';
import PaymentControls from '../../components/cashier/PaymentControls';
import OrderHistoryTabs from '../../components/cashier/OrderHistoryTabs';
import ItemCustomizationModal from '../../components/ui/ItemCustomizationModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import NotificationModal from '../../components/ui/NotificationModal';
import CashierPaymentNotification from '../../components/cashier/CashierPaymentNotification';

const { width } = Dimensions.get('window');

const CashierOrderingScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { logout } = React.useContext(AuthContext);
  const { items, total, clearCart, addToCart, calculateTotalPrice } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [quickAddItem, setQuickAddItem] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const scrollRef = useRef(null);
  const cartCount = items.reduce((n, i) => n + (i.qty || 0), 0);

  const { data: menuItemsRaw, loading: itemsLoading } = useRealTimeCollection('menu', [], ['name', 'asc']);
  
  // Filter available items (support both 'available' boolean and 'status' string)
  const menuItems = useMemo(() => {
    return (menuItemsRaw || []).filter(item => 
      item.status === 'available' || item.available === true
    );
  }, [menuItemsRaw]);

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    const categoryMap = new Map();
    const categoryOrder = ['silog_meals', 'snacks', 'drinks'];
    const categoryNames = {
      'silog_meals': 'Silog Meals',
      'snacks': 'Snacks',
      'drinks': 'Drinks & Beverages'
    };
    
    menuItems.forEach(item => {
      const cat = item.category || item.categoryId;
      if (cat && !categoryMap.has(cat)) {
        categoryMap.set(cat, {
          id: cat,
          name: categoryNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')
        });
      }
    });
    
    // Sort by predefined order, then alphabetically
    return Array.from(categoryMap.values()).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.id);
      const bIndex = categoryOrder.indexOf(b.id);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [menuItems]);

  const pages = useMemo(() => [{ id: 'all', name: 'All' }, ...categories], [categories]);
  // Filter out 'all' from categories since CategoryFilter already has a hardcoded "All" button
  const categoriesForFilter = useMemo(() => categories.filter(c => c.id !== 'all'), [categories]);
  
  const pageIndex = useMemo(() => {
    if (!selectedCategory) return 0;
    const i = pages.findIndex((p) => p.id === selectedCategory);
    return Math.max(0, i);
  }, [selectedCategory, pages]);

  const filterByCategory = (catId) => (catId && catId !== 'all') 
    ? menuItems.filter((i) => i.category === catId || i.categoryId === catId) 
    : menuItems;

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
    // First apply category filter
    let filtered = filterByCategory(selectedCategory);
    
    // Then apply search filter
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((m) => 
        m.name?.toLowerCase().includes(q) || 
        m.description?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [menuItems, search, selectedCategory]);


  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    try {
      const rootNav = navigation.getParent() || navigation;
      rootNav.navigate('Login');
    } catch (e) {
      console.log('Navigation handled by AppNavigator after logout');
    }
  };

  if (itemsLoading) {
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
            <View style={{ flex: 1 }}>
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
        </View>
        
        {/* Action Buttons Row */}
        <View style={[styles.headerActions, { marginTop: spacing.sm, gap: spacing.md }]}>
          {/* Logout Button */}
          <AnimatedButton
            style={{
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }}
            onPress={handleLogout}
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
                  borderWidth: 1.5,
                  borderColor: theme.colors.error,
                  padding: spacing.sm,
                  borderRadius: 999,
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

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Cart Button */}
          <AnimatedButton
            style={{
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
              position: 'relative',
            }}
            onPress={() => navigation.navigate('CashierPayment')}
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
                  backgroundColor: theme.colors.primary + '20',
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary,
                  padding: spacing.sm,
                  borderRadius: 999,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Icon
                  name="cart"
                  library="ionicons"
                  size={22}
                  color={theme.colors.primary}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </View>
            {cartCount > 0 && (
              <View style={[
                styles.cartBadge, 
                { 
                  backgroundColor: theme.colors.error,
                  borderRadius: borderRadius.round,
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: cartCount > 9 ? 4 : 6,
                  position: 'absolute',
                  top: -4,
                  right: -4,
                }
              ]}>
                <Text style={[
                  styles.cartBadgeText,
                  { color: '#FFFFFF' }
                ]}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </AnimatedButton>

          {/* Cash Payment Notification Button with History */}
          <CashierPaymentNotification />

          {/* Search Button */}
          <AnimatedButton
            style={[
              styles.headerButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: borderRadius.round,
                width: 45,
                height: 45,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => setSearchOpen(!searchOpen)}
          >
            <Icon
              name="search"
              library="ionicons"
              size={23}
              color={theme.colors.primary}
            />
          </AnimatedButton>
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
                      textAlignVertical: 'center',
                      paddingVertical: 0,
                    }
                  ]}
                  textAlignVertical="center"
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
                    alignItems: 'center',
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
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  }
                ]}>
                  Search menu items...
                </Text>
              </AnimatedButton>
            )}
          </View>

          {/* Category Filter */}
          <View style={{ marginTop: -spacing.xs }}>
            <CategoryFilter
              categories={categoriesForFilter}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />
          </View>

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

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
        icon="log-out-outline"
      />

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
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    includeFontPadding: false,
    paddingVertical: 0,
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
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    position: 'absolute',
    top: -16,
    right: -14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 10,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
  headerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationBadge: {
    // Styled inline
  },
  notificationBadgeText: {
    // Typography handled via theme
  },
});

export default CashierOrderingScreen;

