import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, FlatList } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { orderService } from '../../services/orderService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

const CashierPaymentScreen = ({ navigation }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { items, total, clearCart, updateQty, removeFromCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Cart is empty', 'Please add items to the cart first.');
      return;
    }
    try {
      setLoading(true);
      await orderService.placeOrder({ 
        items, 
        total, 
        paymentMethod: 'cash', 
        status: 'pending',
        customerName: customerName.trim() || undefined,
        tableNumber: tableNumber.trim() || undefined,
      });
      clearCart();
      setCustomerName('');
      setTableNumber('');
      Alert.alert('Order placed', 'Order has been placed successfully!', [{ 
        text: 'OK', 
        onPress: () => navigation.navigate('CashierOrdering') 
      }]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

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
          borderBottomWidth: 1,
        }
      ]}>
        <View style={styles.headerContent}>
          <AnimatedButton
            onPress={() => navigation.navigate('CashierOrdering')}
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
            Checkout
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Name and Table Number Inputs */}
        <View style={[
          styles.inputSection,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            margin: spacing.md,
            marginBottom: spacing.sm,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
          }
        ]}>
          <Text style={[
            styles.inputLabel,
            {
              color: theme.colors.text,
              ...typography.bodyBold,
              marginBottom: spacing.sm,
            }
          ]}>
            Customer Information
          </Text>
          
          <View style={[styles.inputRow, { marginBottom: spacing.md }]}>
            <Icon
              name="person"
              library="ionicons"
              size={20}
              color={theme.colors.textSecondary}
              style={{ marginRight: spacing.sm }}
            />
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer name (optional)"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  borderWidth: 1.5,
                  flex: 1,
                  ...typography.body,
                }
              ]}
            />
          </View>

          <View style={styles.inputRow}>
            <Icon
              name="restaurant"
              library="ionicons"
              size={20}
              color={theme.colors.textSecondary}
              style={{ marginRight: spacing.sm }}
            />
            <TextInput
              value={tableNumber}
              onChangeText={setTableNumber}
              placeholder="Table number (optional)"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  borderWidth: 1.5,
                  flex: 1,
                  ...typography.body,
                }
              ]}
            />
          </View>
        </View>

        {/* Cart Items */}
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
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
                      backgroundColor: theme.colors.errorLight,
                      borderRadius: borderRadius.round,
                      width: 36,
                      height: 36,
                    }
                  ]}
                >
                  <Icon
                    name="close"
                    library="ionicons"
                    size={20}
                    color={theme.colors.error}
                  />
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
                  {item.addOns.map((a) => (
                    <View key={a.id} style={[styles.addOnRow, { gap: spacing.xs }]}>
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
                onPress={() => navigation.navigate('CashierOrdering')}
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
        />

        {/* Total and Place Order Button */}
        {items.length > 0 && (
          <View style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              borderTopWidth: 2,
              padding: spacing.md,
              marginTop: spacing.md,
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
            <AnimatedButton
              style={[
                styles.btnPrimary,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.lg,
                  paddingVertical: spacing.md,
                  shadowColor: theme.colors.primary,
                }
              ]}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.onPrimary} size="small" />
              ) : (
                <>
                  <Icon
                    name="checkmark-circle"
                    library="ionicons"
                    size={22}
                    color={theme.colors.onPrimary}
                    style={{ marginRight: spacing.sm }}
                  />
                  <Text style={[
                    styles.btnPrimaryText,
                    { 
                      color: theme.colors.onPrimary,
                      ...typography.bodyBold,
                    }
                  ]}>
                    Place Order
                  </Text>
                </>
              )}
            </AnimatedButton>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    // Typography handled via theme
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputSection: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  inputLabel: {
    // Typography handled via theme
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    // Typography handled via theme
  },
  removeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  addOns: {
    // Styled inline
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    elevation: 1
  },
  qtyDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  qty: {
    // Typography handled via theme
  },
  lineTotal: {
    // Typography handled via theme
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4
  },
  totalRow: {
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
  btnPrimary: {
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
  },
});

export default CashierPaymentScreen;
