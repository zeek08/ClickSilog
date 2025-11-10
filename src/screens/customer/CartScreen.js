import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

const CartScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { items, total, updateQty, removeFromCart, clearCart } = useCart();

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
          borderBottomWidth: 1,
        }
      ]}>
        <View style={styles.headerContent}>
          <AnimatedButton
            onPress={() => navigation.navigate('Menu')}
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: borderRadius.round,
                width: 44,
                height: 44,
                borderWidth: 1.5,
                borderColor: theme.colors.primary + '30',
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}
          >
            <Icon
              name="arrow-back"
              library="ionicons"
              size={22}
              color={theme.colors.primary}
            />
          </AnimatedButton>
          <Text style={[
            styles.headerTitle,
            {
              color: theme.colors.text,
              ...typography.h2,
              flex: 1,
              textAlign: 'center',
              marginRight: 44,
            }
          ]}>
            Your Cart
          </Text>
        </View>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        renderItem={({ item }) => (
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
              <Text style={[
                styles.name, 
                { 
                  color: theme.colors.text,
                  ...typography.bodyBold,
                  flex: 1,
                }
              ]}>
                {item.name}
              </Text>
              <AnimatedButton
                onPress={() => removeFromCart(item.id)}
                style={[
                  styles.removeBtn, 
                  { 
                    backgroundColor: 'transparent',
                    borderRadius: borderRadius.round,
                    width: 36,
                    height: 36,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }
                ]}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.errorLight,
                    borderRadius: borderRadius.round,
                  }}
                >
                  <Icon
                    name="close"
                    library="ionicons"
                    size={18}
                    color={theme.colors.error}
                    responsive={true}
                    hitArea={false}
                  />
                </View>
              </AnimatedButton>
            </View>
            {!!item.addOns?.length && (
              <View style={[
                styles.addOns, 
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginTop: spacing.sm,
                }
              ]}>
                {item.addOns.map((a, aIdx) => (
                  <View key={`${item.id}-addon-${a.id || aIdx}`} style={[styles.addOnRow, { gap: spacing.xs }]}>
                    <Icon
                      name="add-circle"
                      library="ionicons"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text style={[
                      styles.addOnLine, 
                      { 
                        color: theme.colors.textSecondary,
                        ...typography.caption,
                        flex: 1,
                      }
                    ]}>
                      {a.name}
                    </Text>
                    <Text style={[
                      styles.addOnPrice, 
                      { 
                        color: theme.colors.primary,
                        ...typography.captionBold,
                      }
                    ]}>
                      +₱{Number(a.price || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {!!item.specialInstructions && (
              <View style={[
                styles.notesContainer, 
                { 
                  backgroundColor: theme.colors.warningLight,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginTop: spacing.sm,
                  flexDirection: 'row',
                  gap: spacing.xs,
                }
              ]}>
                <Icon
                  name="document-text"
                  library="ionicons"
                  size={16}
                  color={theme.colors.warning}
                />
                <Text style={[
                  styles.notes, 
                  { 
                    color: theme.colors.warning,
                    ...typography.caption,
                    flex: 1,
                    fontStyle: 'italic',
                  }
                ]}>
                  {item.specialInstructions}
                </Text>
              </View>
            )}
            <View style={[
              styles.qtyRow, 
              { 
                borderTopColor: theme.colors.border,
                borderTopWidth: 1,
                marginTop: spacing.md,
                paddingTop: spacing.md,
              }
            ]}>
              <View style={[styles.qtyControls, { gap: spacing.md }]}>
                <AnimatedButton
                  style={[
                    styles.qtyBtn, 
                    { 
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: borderRadius.round,
                      width: 40,
                      height: 40,
                    }
                  ]}
                  onPress={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                >
                  <Icon
                    name="remove"
                    library="ionicons"
                    size={20}
                    color={theme.colors.primary}
                  />
                </AnimatedButton>
                <View style={styles.qtyDisplay}>
                  <Text style={[
                    styles.qty, 
                    { 
                      color: theme.colors.text,
                      ...typography.bodyBold,
                    }
                  ]}>
                    {item.qty}
                  </Text>
                </View>
                <AnimatedButton
                  style={[
                    styles.qtyBtn, 
                    { 
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: borderRadius.round,
                      width: 40,
                      height: 40,
                    }
                  ]}
                  onPress={() => updateQty(item.id, item.qty + 1)}
                >
                  <Icon
                    name="add"
                    library="ionicons"
                    size={20}
                    color={theme.colors.primary}
                  />
                </AnimatedButton>
              </View>
              <Text style={[
                styles.lineTotal, 
                { 
                  color: theme.colors.primary,
                  ...typography.h4,
                }
              ]}>
                ₱{((item.totalItemPrice || (item.price || 0)) * item.qty).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name="cart-outline"
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
              Your cart is empty
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
              Add items from the menu to get started
            </Text>
            <AnimatedButton
              style={[
                styles.emptyBtn, 
                { 
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.lg,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.xl,
                  marginTop: spacing.lg,
                }
              ]}
              onPress={() => navigation.navigate('Menu')}
            >
              <Text style={[
                styles.emptyBtnText,
                { color: theme.colors.onPrimary }
              ]}>
                Browse Menu
              </Text>
            </AnimatedButton>
          </View>
        }
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl * 2.5 }}
        showsVerticalScrollIndicator={false}
      />

      {items.length > 0 && (
        <View style={[
          styles.footer, 
          { 
            backgroundColor: theme.colors.surface, 
            borderTopColor: theme.colors.border,
            borderTopWidth: 2,
            padding: spacing.md,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 4
          }
        ]}>
          <View style={[
            styles.totalRow, 
            { 
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
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
            ]}>
              Total
            </Text>
            <Text style={[
              styles.total, 
              { 
                color: theme.colors.primary,
                ...typography.h2,
              }
            ]}>
              ₱{total.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.footerButtons, { gap: spacing.md }]}>
            <AnimatedButton
              style={[
                styles.btnSecondary, 
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  borderRadius: borderRadius.lg,
                  paddingVertical: spacing.md + spacing.xs,
                  paddingHorizontal: spacing.md,
                  flex: 1,
                  borderWidth: 1.5,
                }
              ]}
              onPress={clearCart}
            >
              <Icon
                name="trash-outline"
                library="ionicons"
                size={20}
                color={theme.colors.error}
                responsive={true}
                hitArea={false}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.btnSecondaryText, 
                { 
                  color: theme.colors.error,
                  ...typography.bodyMedium,
                  fontWeight: '600',
                }
              ]}>
                Clear
              </Text>
            </AnimatedButton>
            <AnimatedButton
              style={[
                styles.btnPrimary, 
                { 
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.lg,
                  paddingVertical: spacing.md + spacing.xs,
                  paddingHorizontal: spacing.md,
                  flex: 2,
                  shadowColor: theme.colors.primary,
                }
              ]}
              onPress={() => navigation.navigate('Payment')}
            >
              <Text style={[
                styles.btnPrimaryText,
                { 
                  color: theme.colors.onPrimary,
                  ...typography.bodyMedium,
                  fontWeight: '600',
                }
              ]}>
                Checkout
              </Text>
              <Icon
                name="arrow-forward"
                library="ionicons"
                size={20}
                color={theme.colors.onPrimary}
                responsive={true}
                hitArea={false}
                style={{ marginLeft: spacing.sm }}
              />
            </AnimatedButton>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  name: {
    // Typography handled via theme
  },
  removeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  addOns: {
    // Styled inline
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  addOnLine: {
    // Typography handled via theme
  },
  addOnPrice: {
    // Typography handled via theme
  },
  notesContainer: {
    // Styled inline
  },
  notes: {
    // Typography handled via theme
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  qtyDisplay: {
    minWidth: 32,
    alignItems: 'center'
  },
  qty: {
    // Typography handled via theme
  },
  lineTotal: {
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
  },
  emptyBtn: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  emptyBtnText: {
    // Typography handled via theme
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    // Typography handled via theme
  },
  total: {
    // Typography handled via theme
  },
  footerButtons: {
    flexDirection: 'row'
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  btnSecondaryText: {
    // Typography handled via theme
  },
  btnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  btnPrimaryText: {
    // Typography handled via theme
  }
});

export default CartScreen;
