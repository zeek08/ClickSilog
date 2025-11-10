import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, BackHandler, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { appConfig } from '../../config/appConfig';
import CategoryFilter from '../../components/ui/CategoryFilter';
import MenuItemCard from '../../components/ui/MenuItemCard';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import CustomerOrderNotification from '../../components/customer/CustomerOrderNotification';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { scale } from '../../utils/responsive';

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

const MenuScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { logout } = useContext(AuthContext);
  const { items } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const scrollRef = useRef(null);
  const { width } = Dimensions.get('window');
  const cartCount = items.reduce((n, i) => n + (i.qty || 0), 0);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'TableNumber' }]
            });
  };

  const { data: menuItemsRaw, loading: itemsLoading } = useRealTimeCollection('menu', [], ['name', 'asc']);
  
  // Filter available items (support both 'available' boolean and 'status' string)
  // Hide deactivated items from customer
  const menuItems = useMemo(() => {
    return (menuItemsRaw || []).filter(item => 
      (item.status === 'available' || item.available === true) &&
      item.status !== 'deactivated' &&
      item.available !== false
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Show logout confirmation on back button
      handleLogout();
      return true;
    });
    return () => backHandler.remove();
  }, [navigation]);

  const pages = useMemo(() => [{ id: 'all', name: 'All' }, ...categories], [categories]);
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
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((m) => m.name?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
  }, [menuItems, search]);

  if (itemsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading menu...</Text>
      </View>
    );
  }

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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }
      ]}>
        <AnimatedButton
          onPress={handleLogout}
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
            name="arrow-back"
            library="ionicons"
            size={22}
            color={theme.colors.error}
            responsive={true}
            hitArea={false}
          />
            </View>
          </View>
        </AnimatedButton>
        <View style={[styles.headerRight, { gap: spacing.sm }]}>
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
                size={22}
                color={theme.colors.textSecondary}
                style={{ marginRight: spacing.sm }}
                responsive={true}
                hitArea={false}
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
                    includeFontPadding: false,
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
                  }
                ]}
              >
                <Icon
                  name="close"
                  library="ionicons"
                  size={20}
                  color={theme.colors.error}
                  responsive={true}
                />
              </AnimatedButton>
            </View>
          ) : (
            <>
              <AnimatedButton
                style={{
                    width: 44,
                    height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                }}
                onPress={() => setSearchOpen(true)}
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
                      backgroundColor: hexToRgba(theme.colors.info || '#3B82F6', 0.1), // Blue for search
                      borderWidth: 1.5,
                      borderColor: (theme.colors.info || '#3B82F6') + '40',
                      padding: spacing.sm,
                      borderRadius: 999, // Perfect circle
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: theme.colors.info || '#3B82F6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
              >
                <Icon
                  name="search"
                  library="ionicons"
                  size={22}
                  color={theme.colors.info || '#3B82F6'}
                  responsive={true}
                  hitArea={false}
                />
                  </View>
                </View>
              </AnimatedButton>
              <CustomerOrderNotification />
              <ThemeToggle />
            </>
          )}
          <AnimatedButton
            style={{
                width: 44,
                height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
              position: 'relative',
            }}
            onPress={() => navigation.navigate('Cart')}
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
                  backgroundColor: hexToRgba(theme.colors.success || '#10B981', 0.1), // Green for cart
                  borderWidth: 1.5,
                  borderColor: (theme.colors.success || '#10B981') + '40',
                  padding: spacing.sm,
                  borderRadius: 999, // Perfect circle
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.success || '#10B981',
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
              color={theme.colors.success || '#10B981'}
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
                }
              ]}>
                <Text style={[
                  styles.cartBadgeText,
                  { color: theme.colors.onPrimary }
                ]}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </AnimatedButton>
        </View>
      </View>

      <View style={[
        styles.greeting, 
        { 
          backgroundColor: theme.colors.surface,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        }
      ]}>
        <View style={[styles.greetingContent, { gap: spacing.md }]}>
          <Text style={[
            styles.greetingText, 
            { 
              color: theme.colors.text,
              ...typography.h3,
              flex: 1,
            }
          ]}>
            What would you like to order?
          </Text>
          <View style={[styles.greetingIcons, { gap: spacing.sm }]}>
            <Icon name="star" library="ionicons" size={20} color={theme.colors.primary} responsive={true} />
            <Icon name="restaurant" library="ionicons" size={20} color={theme.colors.info || '#3B82F6'} responsive={true} />
            <Icon name="sparkles" library="ionicons" size={20} color={theme.colors.secondary || '#7C3AED'} responsive={true} />
          </View>
        </View>
      </View>

      <CategoryFilter
        categories={pages.filter((p) => p.id !== 'all')}
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => onSelectCategory(id)}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{}}
      >
        {pages.map((p) => {
          const itemsInPage = filterByCategory(p.id === 'all' ? null : p.id);
          const items = filteredBySearch.filter((m) => itemsInPage.find((x) => x.id === m.id));
          return (
            <View key={p.id} style={{ width, flex: 1 }}>
              {items.length === 0 ? (
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
                    No items in {p.name}
                  </Text>
                  <Text style={[
                    styles.emptySubtext,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.caption,
                      marginTop: spacing.sm,
                    }
                  ]}>
                    Check back later for new items
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <MenuItemCard item={item} />}
                  numColumns={2}
                  contentContainerStyle={[styles.listContent, { padding: spacing.md, paddingBottom: spacing.xl }]}
                  columnWrapperStyle={styles.row}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  initialNumToRender={10}
                  windowSize={10}
                  getItemLayout={(data, index) => ({
                    length: 200, // Approximate item height
                    offset: 200 * Math.floor(index / 2),
                    index,
                  })}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Exit"
        message="Are you sure you want to go back to sign in?"
        confirmText="Yes, Exit"
        cancelText="Cancel"
        type="warning"
        icon="log-out-outline"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    // Shadow properties handled inline for better control
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap handled inline with theme spacing
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',

    minWidth: 250,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  searchInput: {
    // Styled via theme
  },
  searchCancel: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  cartButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.2
  },
  greeting: {
    // Styled inline
  },
  greetingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // gap handled inline with theme spacing
  },
  greetingIcons: {
    flexDirection: 'row',
    // gap handled inline with theme spacing
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12
  },
  listContent: {
    // padding handled inline with theme spacing
  },
  row: {
    justifyContent: 'flex-start'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    textAlign: 'center'
  },
  emptySubtext: {
    textAlign: 'center'
  }
});

export default MenuScreen;
