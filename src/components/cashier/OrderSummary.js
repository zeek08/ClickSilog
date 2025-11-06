import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../ui/Icon';
import AnimatedButton from '../ui/AnimatedButton';

const OrderSummary = () => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { items, total, updateQty, removeFromCart } = useCart();
  const cartCount = items.reduce((n, i) => n + (i.qty || 0), 0);

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        borderTopWidth: 2,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 4,
      }
    ]}>
      <View style={[
        styles.header,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }
      ]}>
        <View style={styles.headerRow}>
          <Icon
            name="cart"
            library="ionicons"
            size={22}
            color={theme.colors.primary}
            style={{ marginRight: spacing.sm }}
          />
          <Text style={[
            styles.headerTitle,
            {
              color: theme.colors.text,
              ...typography.h4,
            }
          ]}>
            Current Order
          </Text>
          <View style={[
            styles.badge,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: borderRadius.round,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            }
          ]}>
            <Text style={[
              styles.badgeText,
              {
                color: theme.colors.primary,
                ...typography.captionBold,
              }
            ]}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={[
          styles.itemsContent,
          {
            padding: spacing.md,
            paddingBottom: spacing.md,
          }
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.itemRow,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }
            ]}
          >
            <View style={[styles.itemLeft, { flex: 1, marginRight: spacing.md }]}>
              <View style={[styles.itemHeader, { marginBottom: spacing.sm }]}>
                <Text style={[
                  styles.itemName,
                  {
                    color: theme.colors.text,
                    ...typography.h4,
                    flex: 1,
                  }
                ]} numberOfLines={2}>
                  {item.name}
                </Text>
                <AnimatedButton
                  onPress={() => removeFromCart(item.id)}
                  style={[
                    styles.removeBtn,
                    {
                      backgroundColor: theme.colors.errorLight,
                      borderRadius: borderRadius.round,
                      width: 32,
                      height: 32,
                      marginLeft: spacing.sm,
                    }
                  ]}
                >
                  <Icon
                    name="trash"
                    library="ionicons"
                    size={16}
                    color={theme.colors.error}
                  />
                </AnimatedButton>
              </View>
              {!!item.addOns?.length && (
                <View style={[styles.addOnsContainer, { marginBottom: spacing.sm, gap: spacing.xs / 2 }]}>
                  {item.addOns.map((a) => (
                    <View key={a.id} style={[styles.addOnRow, { gap: spacing.xs / 2 }]}>
                      <Icon
                        name="add-circle"
                        library="ionicons"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text style={[
                        styles.addOnText,
                        {
                          color: theme.colors.textSecondary,
                          ...typography.caption,
                        }
                      ]}>
                        {a.name}
                      </Text>
                      <Text style={[
                        styles.addOnPrice,
                        {
                          color: theme.colors.primary,
                          ...typography.captionBold,
                          marginLeft: spacing.xs,
                        }
                      ]}>
                        +₱{Number(a.price || 0).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {item.specialInstructions && (
                <View style={[
                  styles.notesContainer,
                  {
                    backgroundColor: theme.colors.warningLight,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.xs,
                  }
                ]}>
                  <Icon
                    name="document-text"
                    library="ionicons"
                    size={14}
                    color={theme.colors.warning}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={[
                    styles.instructions,
                    {
                      color: theme.colors.warning,
                      ...typography.caption,
                      fontStyle: 'italic',
                      flex: 1,
                    }
                  ]} numberOfLines={2}>
                    {item.specialInstructions}
                  </Text>
                </View>
              )}
              <View style={[
                styles.qtyRow,
                {
                  borderTopColor: theme.colors.border,
                  borderTopWidth: 1,
                  paddingTop: spacing.sm,
                  marginTop: spacing.sm,
                }
              ]}>
                <View style={[styles.qtyControls, { gap: spacing.sm }]}>
                  <AnimatedButton
                    onPress={() => updateQty(item.id, Math.max(1, (item.qty || 1) - 1))}
                    style={[
                      styles.qtyBtn,
                      {
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary,
                        borderRadius: borderRadius.md,
                        width: 36,
                        height: 36,
                        borderWidth: 1.5,
                      }
                    ]}
                  >
                    <Icon
                      name="remove"
                      library="ionicons"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </AnimatedButton>
                  <Text style={[
                    styles.qtyText,
                    {
                      color: theme.colors.text,
                      ...typography.h4,
                      minWidth: 40,
                      textAlign: 'center',
                    }
                  ]}>
                    {item.qty || 1}
                  </Text>
                  <AnimatedButton
                    onPress={() => updateQty(item.id, (item.qty || 1) + 1)}
                    style={[
                      styles.qtyBtn,
                      {
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary,
                        borderRadius: borderRadius.md,
                        width: 36,
                        height: 36,
                        borderWidth: 1.5,
                      }
                    ]}
                  >
                    <Icon
                      name="add"
                      library="ionicons"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </AnimatedButton>
                </View>
                <Text style={[
                  styles.itemPrice,
                  {
                    color: theme.colors.primary,
                    ...typography.h3,
                  }
                ]}>
                  ₱{Number((item.totalItemPrice || item.price || 0) * (item.qty || 1)).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[
        styles.footer,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          padding: spacing.md,
        }
      ]}>
        <View style={styles.totalRow}>
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
            styles.totalAmount,
            {
              color: theme.colors.primary,
              ...typography.h2,
            }
          ]}>
            ₱{Number(total).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Space for PaymentControls
    left: 0,
    right: 0,
    maxHeight: '50%',
  },
  header: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    // Typography handled via theme
    flex: 1,
  },
  badge: {
    // Styled inline
  },
  badgeText: {
    // Typography handled via theme
  },
  itemsList: {
    flex: 1,
    maxHeight: 200,
  },
  itemsContent: {
    // Padding handled inline
  },
  itemRow: {
    // Styled inline
  },
  itemLeft: {
    // Styled inline
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemName: {
    // Typography handled via theme
  },
  addOnsContainer: {
    // Styled inline
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  addOnText: {
    // Typography handled via theme
  },
  addOnPrice: {
    // Typography handled via theme
  },
  notesContainer: {
    // Styled inline
  },
  instructions: {
    // Typography handled via theme
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyText: {
    // Typography handled via theme
  },
  itemPrice: {
    // Typography handled via theme
  },
  removeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  footer: {
    // Styled inline
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    // Typography handled via theme
  },
  totalAmount: {
    // Typography handled via theme
  },
});

export default OrderSummary;

