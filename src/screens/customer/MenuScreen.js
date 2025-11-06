import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, BackHandler, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import CategoryFilter from '../../components/ui/CategoryFilter';
import MenuItemCard from '../../components/ui/MenuItemCard';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

const MenuScreen = () => {
  const navigation = useNavigation();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { items } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);
  const { width } = Dimensions.get('window');
  const cartCount = items.reduce((n, i) => n + (i.qty || 0), 0);

  const { data: categories, loading: categoriesLoading } = useRealTimeCollection('menu_categories', [['active', '==', true]], ['sortOrder', 'asc']);
  const { data: menuItems, loading: itemsLoading } = useRealTimeCollection('menu', [['available', '==', true]], ['name', 'asc']);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Home');
      return true;
    });
    return () => backHandler.remove();
  }, [navigation]);

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
          paddingTop: spacing.xl + spacing.sm,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }
      ]}>
        <AnimatedButton
          onPress={() => navigation.navigate('Home')}
          style={[
            styles.avatar, 
            { 
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary + '30',
              borderRadius: borderRadius.round,
              width: 44,
              height: 44,
              borderWidth: 1.5,
            }
          ]}
        >
          <Icon
            name="person"
            library="ionicons"
            size={22}
            color={theme.colors.primary}
          />
        </AnimatedButton>
        <View style={styles.headerRight}>
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
                  }
                ]}
              >
                <Icon
                  name="close"
                  library="ionicons"
                  size={18}
                  color={theme.colors.error}
                />
              </AnimatedButton>
            </View>
          ) : (
            <>
              <ThemeToggle style={{ marginRight: spacing.sm }} />
              <AnimatedButton
                style={[
                  styles.iconButton, 
                  { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: borderRadius.round,
                    width: 44,
                    height: 44,
                    borderWidth: 1.5,
                  }
                ]}
                onPress={() => setSearchOpen(true)}
              >
                <Icon
                  name="search"
                  library="ionicons"
                  size={20}
                  color={theme.colors.primary}
                />
              </AnimatedButton>
            </>
          )}
          <AnimatedButton
            style={[
              styles.cartButton, 
              { 
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary + '30',
                borderRadius: borderRadius.round,
                width: 44,
                height: 44,
                borderWidth: 1.5,
              }
            ]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon
              name="cart"
              library="ionicons"
              size={20}
              color={theme.colors.primary}
            />
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
        <View style={styles.greetingContent}>
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
          <View style={styles.greetingIcons}>
            <Icon name="star" library="ionicons" size={20} color={theme.colors.primary} />
            <Icon name="restaurant" library="ionicons" size={20} color={theme.colors.primary} />
            <Icon name="sparkles" library="ionicons" size={20} color={theme.colors.primary} />
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
                  contentContainerStyle={styles.listContent}
                  columnWrapperStyle={styles.row}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
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
    gap: 8
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
    minWidth: 200,
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
    gap: 12
  },
  greetingIcons: {
    flexDirection: 'row',
    gap: 8,
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
    padding: 12,
    paddingBottom: 20
  },
  row: {
    justifyContent: 'space-between'
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
