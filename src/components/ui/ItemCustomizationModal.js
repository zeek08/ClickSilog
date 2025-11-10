import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { firestoreService } from '../../services/firestoreService';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedButton from './AnimatedButton';
import Icon from './Icon';

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

const SelectableRow = ({ label, price, selected, onPress, theme, spacing, borderRadius, typography }) => (
  <TouchableOpacity
    style={[
      {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
        borderWidth: 2,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: selected ? 0.1 : 0.05,
        shadowRadius: selected ? 4 : 2,
        elevation: selected ? 2 : 1,
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <View style={[
        {
          width: 24,
          height: 24,
          borderRadius: borderRadius.round,
          borderWidth: 2.5,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          marginRight: spacing.sm,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        }
      ]}>
        {selected && <Text style={{ color: theme.colors.onPrimary, fontSize: 14, fontWeight: '900' }}>✓</Text>}
      </View>
      <Text style={[
        {
          fontSize: 14,
          fontWeight: selected ? '800' : '700',
          color: selected ? theme.colors.primary : theme.colors.text,
          ...typography.body,
        }
      ]}>{label}</Text>
    </View>
    <Text style={[
      {
        fontSize: 14,
        fontWeight: '800',
        color: selected ? theme.colors.primary : theme.colors.textSecondary,
        ...typography.body,
      }
    ]}>₱{Number(price || 0).toFixed(2)}</Text>
  </TouchableOpacity>
);

export default function ItemCustomizationModal({ visible, onClose, item, onConfirm, calculateTotalPrice }) {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [addOns, setAddOns] = useState([]);
  const [links, setLinks] = useState([]);
  const [qty, setQty] = useState(1);
  const [selectedRice, setSelectedRice] = useState([]); // Array of { id, name, price, qty } - changed to array for multi-select
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]); // Array of { id, name, price, qty }
  const [notes, setNotes] = useState('');
  const [size, setSize] = useState('small');

  // Category detection (prefer category field, fallback to categoryId for backward compatibility)
  const categoryId = item?.category || item?.categoryId || '';
  const itemName = (item?.name || '').toLowerCase();
  
  // Category flags
  const isMealOrSilog = categoryId === 'silog_meals' || categoryId === 'meal' || categoryId === 'silog';
  const isSnack = categoryId === 'snacks' || categoryId === 'snack';
  const isDrink = categoryId === 'drinks' || categoryId === 'drink' || /lemonade|tea|water|soft|drink/i.test(itemName);
  const isSoftdrink = /soft|cola|coke|sprite|royal|pepsi|fanta|soda/i.test(itemName) && (categoryId === 'drinks' || categoryId === 'drink');
  
  // Allowed add-ons for meal/silog categories (fixed list)
  const allowedMealAddOnNames = [
    'extra plain rice',
    'extra java rice', 
    'extra egg',
    'extra hotdog',
    'extra spam'
  ];

  const drinkSmallPrice = useMemo(() => {
    if (!isDrink) return item?.price || 0;
    if (/\(\s*Large\s*\)/i.test(item?.name || '')) return Math.max(0, (item?.price || 0) - 10);
    return item?.price || 0;
  }, [item, isDrink]);
  const drinkLargePrice = useMemo(() => (isDrink ? drinkSmallPrice + 10 : item?.price || 0), [drinkSmallPrice, isDrink, item]);

  useEffect(() => {
    if (!visible) return;
    const u1 = firestoreService.subscribeCollection('addons', { conditions: [['available', '==', true]], order: ['createdAt', 'asc'], next: setAddOns });
    const u2 = firestoreService.subscribeCollection('menu_addons', { conditions: [['menuItemId', '==', item.id]], order: ['sortOrder', 'asc'], next: setLinks });
    return () => { u1 && u1(); u2 && u2(); };
  }, [visible, item?.id]);

  useEffect(() => {
    if (!visible) {
      setQty(1);
      setSelectedRice([]);
      setSelectedDrink(null);
      setSelectedExtras([]);
      setNotes('');
      setSize(/\(\s*Large\s*\)/i.test(item?.name || '') ? 'large' : 'small');
    }
  }, [visible]);

  // Get add-on category helper (same as in AddOnsManager)
  const getAddOnCategory = (addon) => {
    if (addon.category) return addon.category;
    const name = (addon.name || '').toLowerCase();
    if (name.includes('rice')) return 'rice';
    if (name.includes('drink') || name.includes('lemonade') || name.includes('tea') || name.includes('water')) return 'drink';
    return 'extra';
  };

  // Filter add-ons based on category rules
  // For silog_meals, show all available add-ons (not just those in menu_addons)
  const grouped = useMemo(() => {
    const rice = [];
    const drink = [];
    const extra = [];
    
    // For softdrinks: disable all customization
    if (isSoftdrink) {
      return { rice: [], drink: [], extra: [] };
    }
    
    // For snacks and drinks: only allow size, no add-ons
    if (isSnack || (isDrink && !isMealOrSilog)) {
      return { rice: [], drink: [], extra: [] };
    }
    
    // For meal/silog: show all available add-ons that match the category
    if (isMealOrSilog) {
      const addedIds = new Set(); // Track added addon IDs to prevent duplicates
      addOns.forEach((a) => {
        // Skip if already added
        if (addedIds.has(a.id)) return;
        
        // Check if add-on is linked to silog_meals category
        const isLinked = a.linkedTo && Array.isArray(a.linkedTo) && a.linkedTo.includes('silog_meals');
        // Also check if it's in menu_addons (for backward compatibility)
        const isInMenuAddons = links.some(l => l.addOnId === a.id);
        
        // Show add-on if it's linked to silog_meals OR in menu_addons
        // For silog meals, show all add-ons that are linked (no name matching required)
        if (isLinked || isInMenuAddons) {
          const category = getAddOnCategory(a);
          if (category === 'rice') {
            rice.push(a);
            addedIds.add(a.id);
          } else if (category === 'drink') {
            drink.push(a);
            addedIds.add(a.id);
          } else if (category === 'extra') {
            extra.push(a);
            addedIds.add(a.id);
          }
        }
      });
    } else {
      // For other categories, use menu_addons links if available
      const allowedAddOnIds = new Set(links.map((l) => l.addOnId));
      addOns.forEach((a) => {
        if (allowedAddOnIds.has(a.id)) {
          const category = getAddOnCategory(a);
          if (category === 'rice') rice.push(a);
          else if (category === 'drink') drink.push(a);
          else if (category === 'extra') extra.push(a);
        }
      });
    }
    
    return { rice, drink, extra };
  }, [addOns, links, isMealOrSilog, isSnack, isDrink, isSoftdrink, allowedMealAddOnNames]);

  const selectedAddOns = useMemo(() => {
    // Rice is just selection (no quantity) - use as single items
    const riceItems = selectedRice.map((rice) => ({ ...rice, qty: 1 }));
    // Flatten extras with quantities
    const extrasWithQty = selectedExtras.flatMap((extra) => {
      const qty = extra.qty || 1;
      return Array(qty).fill(null).map(() => ({ ...extra, qty: 1 }));
    });
    return [...riceItems, selectedDrink, ...extrasWithQty].filter(Boolean);
  }, [selectedRice, selectedDrink, selectedExtras]);

  // Size pricing for snacks (default to item price for both sizes)
  const snackSmallPrice = item?.price || 0;
  const snackLargePrice = item?.price || 0;

  const basePrice = useMemo(() => {
    if (isSoftdrink) return item?.price || 0;
    if (isSnack) return size === 'large' ? snackLargePrice : snackSmallPrice;
    if (isDrink) return size === 'large' ? drinkLargePrice : drinkSmallPrice;
    return item?.price || 0;
  }, [isDrink, isSnack, isSoftdrink, size, drinkLargePrice, drinkSmallPrice, snackLargePrice, snackSmallPrice, item]);

  const unitPrice = useMemo(() => calculateTotalPrice(basePrice, selectedAddOns), [basePrice, selectedAddOns, calculateTotalPrice]);
  const totalPrice = unitPrice * qty;

  const toggleRice = (id) => {
    const addon = grouped.rice.find((e) => e.id === id);
    if (!addon) return;
    
    setSelectedRice((prev) => {
      const existing = prev.find((x) => x.id === id);
      if (existing) {
        // If exists, remove it
        return prev.filter((x) => x.id !== id);
      } else {
        // If not exists, add it (no quantity needed for rice)
        return [...prev, addon];
      }
    });
  };


  const toggleExtra = (id) => {
    const addon = grouped.extra.find((e) => e.id === id);
    if (!addon) return;
    
    setSelectedExtras((prev) => {
      const existing = prev.find((x) => x.id === id);
      if (existing) {
        // If exists, remove it
        return prev.filter((x) => x.id !== id);
      } else {
        // If not exists, add it with qty 1
        return [...prev, { ...addon, qty: 1 }];
      }
    });
  };

  const updateExtraQty = (id, delta) => {
    setSelectedExtras((prev) => {
      return prev.map((x) => {
        if (x.id === id) {
          const currentQty = x.qty || 1;
          const newQty = currentQty + delta;
          // If quantity would go below 1, remove the add-on instead
          if (newQty < 1) {
            return null; // Mark for removal
          }
          return { ...x, qty: newQty };
        }
        return x;
      }).filter(Boolean); // Remove null entries
    });
  };

  // Customization options based on category
  const showSizeSelection = (isSnack || (isDrink && !isSoftdrink && !isMealOrSilog)) && !isSoftdrink;
  const showAddOns = isMealOrSilog && !isSoftdrink;
  const showSpecialInstructions = !isSoftdrink;

  const confirm = () => {
    // Validate category rules before confirming
    if (isSoftdrink) {
      // Softdrinks: no customization allowed
      onConfirm({ qty, selectedAddOns: [], specialInstructions: '', totalItemPrice: unitPrice });
      return;
    }
    
    // Include size selection for snacks and drinks (not softdrinks)
    const sizeAddOn = showSizeSelection ? [{ id: `size_${size}`, name: `Size: ${size === 'large' ? 'Large' : 'Small'}`, price: 0 }] : [];
    onConfirm({ qty, selectedAddOns: [...sizeAddOn, ...selectedAddOns], specialInstructions: notes, totalItemPrice: unitPrice });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background, flex: 1 }]}>
        <View style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: spacing.xl + spacing.sm,
            padding: spacing.lg,
          }
        ]}>
          <Text style={[
            styles.title,
            {
              color: theme.colors.text,
              ...typography.h2,
            }
          ]}>{item.name.replace(/\s*\((Small|Large)\)\s*/i, '')}</Text>
          <TouchableOpacity onPress={onClose} style={[
            styles.closeHeaderBtn,
            {
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }
          ]} activeOpacity={0.7}>
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
                  name="close"
                  library="ionicons"
                  size={20}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              padding: spacing.lg,
              paddingBottom: spacing.xxl + 300, // Extra padding to ensure special instructions is fully accessible above footer
            }
          ]} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          enableResetScrollToCoords={false}
          scrollEnabled={true}
        >
          {/* Size Selection - Only for snacks and drinks (not softdrinks) */}
          {showSizeSelection && (
            <View style={[styles.section, { marginBottom: spacing.lg }]}>
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                  marginBottom: spacing.md,
                }
              ]}>Choose Size</Text>
              <SelectableRow 
                label="Small" 
                price={isSnack ? snackSmallPrice : drinkSmallPrice} 
                selected={size === 'small'} 
                onPress={() => setSize('small')}
                theme={theme}
                spacing={spacing}
                borderRadius={borderRadius}
                typography={typography}
              />
              <SelectableRow 
                label="Large" 
                price={isSnack ? snackLargePrice : drinkLargePrice} 
                selected={size === 'large'} 
                onPress={() => setSize('large')}
                theme={theme}
                spacing={spacing}
                borderRadius={borderRadius}
                typography={typography}
              />
            </View>
          )}

          {/* Quantity - Always shown */}
          <View style={[
            styles.qtySection,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1.5,
            }
          ]}>
            <Text style={[
              styles.qtyLabel,
              {
                color: theme.colors.text,
                ...typography.h4,
                marginBottom: spacing.md,
              }
            ]}>Quantity</Text>
            <View style={[styles.qtyRow, { gap: spacing.md }]}>
              <AnimatedButton
                style={[
                  styles.qtyBtn,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: borderRadius.round,
                    width: 48,
                    height: 48,
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary + '40',
                  }
                ]}
                onPress={() => setQty(Math.max(1, qty - 1))}
              >
                <Icon
                  name="remove"
                  library="ionicons"
                  size={24}
                  color={theme.colors.primary}
                  responsive={true}
                  hitArea={false}
                />
              </AnimatedButton>
              <View style={[
                styles.qtyDisplay,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  borderRadius: borderRadius.md,
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary + '40',
                  minWidth: 60,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }
              ]}>
                <Text style={[
                  styles.qtyText,
                  {
                    color: theme.colors.primary,
                    ...typography.h3,
                    fontWeight: '800',
                  }
                ]}>{qty}</Text>
              </View>
              <AnimatedButton
                style={[
                  styles.qtyBtn,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: borderRadius.round,
                    width: 48,
                    height: 48,
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary + '40',
                  }
                ]}
                onPress={() => setQty(qty + 1)}
              >
                <Icon
                  name="add"
                  library="ionicons"
                  size={24}
                  color={theme.colors.primary}
                  responsive={true}
                  hitArea={false}
                />
              </AnimatedButton>
            </View>
          </View>

          {/* Add-ons - Only for meal/silog categories */}
          {showAddOns && grouped.rice.length > 0 && (
            <View style={[styles.section, { marginBottom: spacing.lg }]}>
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                  marginBottom: spacing.md,
                }
              ]}>Rice</Text>
              {grouped.rice.map((a) => {
                const selected = selectedRice.find((x) => x.id === a.id);
                return (
                  <SelectableRow 
                    key={a.id}
                    label={a.name} 
                    price={a.price} 
                    selected={!!selected} 
                    onPress={() => toggleRice(a.id)}
                    theme={theme}
                    spacing={spacing}
                    borderRadius={borderRadius}
                    typography={typography}
                  />
                );
              })}
            </View>
          )}

          {showAddOns && grouped.drink.length > 0 && (
            <View style={[styles.section, { marginBottom: spacing.lg }]}>
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                  marginBottom: spacing.md,
                }
              ]}>Add a Drink</Text>
              {grouped.drink.map((a) => (
                <SelectableRow 
                  key={a.id} 
                  label={a.name} 
                  price={a.price} 
                  selected={selectedDrink?.id === a.id} 
                  onPress={() => setSelectedDrink(a)}
                  theme={theme}
                  spacing={spacing}
                  borderRadius={borderRadius}
                  typography={typography}
                />
              ))}
            </View>
          )}

          {showAddOns && grouped.extra.length > 0 && (
            <View style={[styles.section, { marginBottom: spacing.lg }]}>
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                  marginBottom: spacing.md,
                }
              ]}>Extra Add-ons</Text>
              {grouped.extra.map((a) => {
                const selected = selectedExtras.find((x) => x.id === a.id);
                const qty = selected?.qty || 0;
                return (
                  <View key={a.id} style={{ marginBottom: spacing.sm }}>
                <SelectableRow 
                  label={a.name} 
                  price={a.price} 
                      selected={qty > 0} 
                  onPress={() => toggleExtra(a.id)}
                  theme={theme}
                  spacing={spacing}
                  borderRadius={borderRadius}
                  typography={typography}
                />
                    {qty > 0 && (
                      <View style={[styles.qtyRow, { marginTop: spacing.xs, gap: spacing.md, justifyContent: 'center' }]}>
                        <AnimatedButton
                          style={[
                            styles.qtyBtnSmall,
                            {
                              backgroundColor: theme.colors.primaryContainer,
                              borderRadius: borderRadius.round,
                              width: 36,
                              height: 36,
                              borderWidth: 1.5,
                              borderColor: theme.colors.primary + '40',
                            }
                          ]}
                          onPress={() => updateExtraQty(a.id, -1)}
                        >
                          <Icon
                            name="remove"
                            library="ionicons"
                            size={18}
                            color={theme.colors.primary}
                            responsive={true}
                            hitArea={false}
                          />
                        </AnimatedButton>
                        <View style={[
                          styles.qtyDisplaySmall,
                          {
                            backgroundColor: theme.colors.primaryContainer,
                            borderRadius: borderRadius.md,
                            borderWidth: 1.5,
                            borderColor: theme.colors.primary + '40',
                            minWidth: 40,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                          }
                        ]}>
                          <Text style={[
                            styles.qtyTextSmall,
                            {
                              color: theme.colors.primary,
                              ...typography.bodyBold,
                              fontWeight: '800',
                              textAlign: 'center',
                            }
                          ]}>{qty}</Text>
                        </View>
                        <AnimatedButton
                          style={[
                            styles.qtyBtnSmall,
                            {
                              backgroundColor: theme.colors.primaryContainer,
                              borderRadius: borderRadius.round,
                              width: 36,
                              height: 36,
                              borderWidth: 1.5,
                              borderColor: theme.colors.primary + '40',
                            }
                          ]}
                          onPress={() => updateExtraQty(a.id, 1)}
                        >
                          <Icon
                            name="add"
                            library="ionicons"
                            size={18}
                            color={theme.colors.primary}
                            responsive={true}
                            hitArea={false}
                          />
                        </AnimatedButton>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Special Instructions - Disabled for softdrinks */}
          {showSpecialInstructions && (
            <View style={[styles.section, { marginBottom: spacing.lg }]}>
              <Text style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  ...typography.h4,
                  marginBottom: spacing.md,
                }
              ]}>Special Instructions</Text>
              <TextInput
                placeholder="Add notes (e.g., less ice)"
                placeholderTextColor={theme.colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    ...typography.body,
                  }
                ]}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {/* Info message for softdrinks */}
          {isSoftdrink && (
            <View style={[styles.section, { marginBottom: spacing.lg }]}>
              <Text style={[
                styles.infoText,
                {
                  color: theme.colors.textSecondary,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  ...typography.body,
                }
              ]}>No customization options available for soft drinks.</Text>
            </View>
          )}
        </KeyboardAwareScrollView>

        <View style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            padding: spacing.lg,
            paddingBottom: spacing.lg + 20, // Extra bottom padding for safe area
            borderTopWidth: 1.5,
          }
        ]}>
          <View style={[
            styles.totalContainer,
            {
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1.5,
              marginBottom: spacing.md,
              paddingBottom: spacing.md,
            }
          ]}>
            <Text style={[
              styles.totalLabel,
              {
                color: theme.colors.text,
                ...typography.h4,
              }
            ]}>Total</Text>
            <Text style={[
              styles.total,
              {
                color: theme.colors.primary,
                ...typography.h2,
              }
            ]}>₱{Number(totalPrice).toFixed(2)}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.addBtn,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: borderRadius.lg,
                paddingVertical: spacing.md,
              }
            ]} 
            onPress={confirm} 
            activeOpacity={0.8}
          >
            <Text style={[
              styles.addBtnText,
              {
                color: theme.colors.onPrimary,
                ...typography.button,
              }
            ]}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  title: {
    flex: 1,
  },
  closeHeaderBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  closeHeaderText: {
    fontSize: 18,
    fontWeight: '900'
  },
  scrollContent: {
    // Padding handled inline
  },
  qtySection: {
    alignItems: 'center',
  },
  qtyLabel: {
    // Typography handled via theme
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap handled inline with theme spacing
  },
  qtyBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  qtyBtnSmall: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  qtyDisplay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyDisplaySmall: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    textAlign: 'center',
  },
  qtyTextSmall: {
    textAlign: 'center',
  },
  section: {
    // Margin handled inline
  },
  sectionTitle: {
    // Typography handled via theme
  },
  input: {
    borderWidth: 1.5,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    // Typography handled via theme
  },
  total: {
    // Typography handled via theme
  },
  addBtn: {
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  addBtnText: {
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.5
  },
  infoText: {
    fontStyle: 'italic',
    textAlign: 'center',
    borderWidth: 1.5,
  }
});
