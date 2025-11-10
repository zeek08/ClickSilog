import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const MenuAddOnsManager = () => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [menu, setMenu] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);

  useEffect(() => {
    const u1 = firestoreService.subscribeCollection('menu', { conditions: [], order: ['name', 'asc'], next: setMenu });
    const u2 = firestoreService.subscribeCollection('addons', { conditions: [['available', '==', true]], order: ['createdAt', 'asc'], next: setAddOns });
    const u3 = firestoreService.subscribeCollection('menu_addons', { conditions: [], order: ['sortOrder', 'asc'], next: setMappings });
    return () => { u1 && u1(); u2 && u2(); u3 && u3(); };
  }, []);

  useEffect(() => {
    if (!selectedMenuId && menu.length) setSelectedMenuId(menu[0].id);
  }, [menu, selectedMenuId]);

  const selectedMenuItem = useMemo(() => menu.find((m) => m.id === selectedMenuId), [menu, selectedMenuId]);
  const category = selectedMenuItem?.category || selectedMenuItem?.categoryId || '';
  const isSilogMeal = category === 'silog_meals';
  const isDrink = category === 'drinks';
  const isSnack = category === 'snacks';

  // Allowed add-on names for Silog meals
  const allowedSilogAddOnNames = ['Extra Rice', 'Extra Java Rice', 'Extra Egg', 'Extra Hotdog', 'Extra Spam'];
  const allowedSilogCategories = ['rice', 'extra']; // Rice and extra for Silog meals

  const linkedIds = useMemo(() => new Set(mappings.filter((m) => m.menuItemId === selectedMenuId).map((m) => m.addOnId)), [mappings, selectedMenuId]);
  
  const available = useMemo(() => {
    let filtered = addOns.filter((a) => !linkedIds.has(a.id));
    
    // For Silog meals, only show specific add-ons
    if (isSilogMeal) {
      filtered = filtered.filter((a) => {
        // Allow drinks (to be added as add-ons)
        if (a.category === 'drink') return true;
        // Allow rice and extra categories
        if (allowedSilogCategories.includes(a.category)) {
          // Check if name matches allowed list
          return allowedSilogAddOnNames.some(name => a.name.toLowerCase().includes(name.toLowerCase().replace('extra ', '')));
        }
        return false;
      });
    }
    
    // For drinks, hide add-ons (drinks only have size selection)
    if (isDrink) {
      filtered = [];
    }
    
    // For snacks, hide add-ons
    if (isSnack) {
      filtered = [];
    }
    
    return filtered;
  }, [addOns, linkedIds, isSilogMeal, isDrink, isSnack]);

  const link = async (addOnId) => {
    const id = `${selectedMenuId}_${addOnId}`;
    const sortOrder = (mappings.filter((m) => m.menuItemId === selectedMenuId).length) || 0;
    await firestoreService.upsertDocument('menu_addons', id, { menuItemId: selectedMenuId, addOnId, sortOrder, createdAt: new Date().toISOString() });
  };

  const getCategoryIcon = (cat) => {
    if (cat === 'rice') return { name: 'basket', library: 'ionicons' };
    if (cat === 'drink') return { name: 'water', library: 'ionicons' };
    return { name: 'add-circle', library: 'ionicons' };
  };

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
              name="link"
              library="ionicons"
              size={28}
              color={theme.colors.accent}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[
              styles.headerTitle,
              {
                color: theme.colors.text,
                ...typography.h2,
              }
            ]}>
              Menu Add-ons
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={[
          styles.menuScroll,
          {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            gap: spacing.md,
          }
        ]}
      >
        {menu.map((m) => (
          <AnimatedButton
            key={m.id}
            style={[
              styles.menuTab,
              {
                backgroundColor: selectedMenuId === m.id ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: selectedMenuId === m.id ? theme.colors.primary : theme.colors.border,
                borderRadius: borderRadius.lg,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                borderWidth: 1.5,
                shadowColor: selectedMenuId === m.id ? theme.colors.primary : undefined,
              }
            ]}
            onPress={() => setSelectedMenuId(m.id)}
          >
            <Text style={[
              styles.menuTabText,
              {
                color: selectedMenuId === m.id ? theme.colors.onPrimary : theme.colors.textSecondary,
                ...typography.captionBold,
                maxWidth: 140,
              }
            ]} numberOfLines={1}>
              {m.name}
            </Text>
          </AnimatedButton>
        ))}
      </ScrollView>

      <View style={[
        styles.sections,
        {
          flex: 1,
          padding: spacing.md,
        }
      ]}>
        {!isSnack && (
          <View style={[styles.section, { marginBottom: spacing.xl }]}>
            <View style={[
              styles.sectionHeader,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary + '40',
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderWidth: 1.5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }
            ]}>
              <Icon
                name="add-circle"
                library="ionicons"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                }
              ]}>
                Available Add-ons
              </Text>
        </View>
          <FlatList
            data={available}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => {
              const categoryIcon = getCategoryIcon(item.category);
              return (
                <View style={[
                  styles.row,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                    marginHorizontal: spacing.md,
                    borderWidth: 1.5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }
                ]}>
                  <View style={[styles.rowLeft, { flex: 1, marginRight: spacing.md }]}>
                    <Text style={[
                      styles.rowLabel,
                      {
                        color: theme.colors.text,
                        ...typography.bodyBold,
                        marginBottom: spacing.xs,
                      }
                    ]}>
                      {item.name}
                    </Text>
                    <View style={[
                      styles.metaContainer,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        borderRadius: borderRadius.sm,
                        padding: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }
                    ]}>
                      <Icon
                        name="cash"
                        library="ionicons"
                        size={12}
                        color={theme.colors.textSecondary}
                      />
                      <Text style={[
                        styles.rowMeta,
                        {
                          color: theme.colors.textSecondary,
                          ...typography.caption,
                          marginRight: spacing.xs,
                        }
                      ]}>
                        ₱{Number(item.price || 0).toFixed(2)}
                      </Text>
                      <Icon
                        name={categoryIcon.name}
                        library={categoryIcon.library}
                        size={12}
                        color={theme.colors.textSecondary}
                      />
                      <Text style={[
                        styles.rowMeta,
                        {
                          color: theme.colors.textSecondary,
                          ...typography.caption,
                          textTransform: 'capitalize',
                        }
                      ]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>
                  <AnimatedButton
                    style={[
                      styles.addBtn,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: borderRadius.md,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.lg,
                        minWidth: 100,
                        shadowColor: theme.colors.primary,
                      }
                    ]}
                    onPress={() => link(item.id)}
                  >
                    <Icon
                      name="add"
                      library="ionicons"
                      size={16}
                      color={theme.colors.onPrimary}
                      style={{ marginRight: spacing.xs }}
                    />
                    <Text style={[
                      styles.addBtnText,
                      {
                        color: theme.colors.onPrimary,
                        ...typography.captionBold,
                      }
                    ]}>
                      Add
                    </Text>
                  </AnimatedButton>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={[styles.empty, { padding: spacing.xxl }]}>
                <Icon
                  name="checkmark-circle"
                  library="ionicons"
                  size={80}
                  color={theme.colors.success}
                />
                <Text style={[
                  styles.emptyText,
                  {
                    color: theme.colors.text,
                    ...typography.h4,
                    marginTop: spacing.lg,
                  }
                ]}>
                  All add-ons linked
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
                  All available add-ons are linked to this item
                </Text>
              </View>
            }
          />
                </View>
        )}
        {isSnack && (
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name="fast-food-outline"
              library="ionicons"
              size={80}
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
              No Add-ons for Snacks
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
              Snacks do not support add-ons
            </Text>
              </View>
            )}
        {isDrink && (
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name="water-outline"
              library="ionicons"
              size={80}
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
              Drinks Only Have Size Selection
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
              Drinks do not support add-ons, only size selection
            </Text>
        </View>
        )}
      </View>
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
    // Typography handled via theme
  },
  menuScroll: {
    // Padding handled inline
  },
  menuTab: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  menuTabText: {
    // Typography handled via theme
  },
  sections: {
    // Styled inline
  },
  section: {
    // Margin handled inline
  },
  sectionHeader: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  sectionTitle: {
    // Typography handled via theme
  },
  row: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  rowLeft: {
    // Styled inline
  },
  rowLabel: {
    // Typography handled via theme
  },
  metaContainer: {
    // Styled inline
  },
  rowMeta: {
    // Typography handled via theme
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  addBtnText: {
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

export default MenuAddOnsManager;
