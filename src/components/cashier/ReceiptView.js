import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../ui/Icon';

const ReceiptView = ({ order }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();

  if (!order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[
        styles.receipt,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          margin: spacing.md,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
        }
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <Icon
            name="restaurant"
            library="ionicons"
            size={32}
            color={theme.colors.primary}
          />
          <Text style={[
            styles.restaurantName,
            {
              color: theme.colors.text,
              ...typography.h2,
              marginTop: spacing.sm,
            }
          ]}>
            ClickSiLog
          </Text>
          <Text style={[
            styles.restaurantAddress,
            {
              color: theme.colors.textSecondary,
              ...typography.caption,
              marginTop: spacing.xs,
            }
          ]}>
            Restaurant Self-Service Order
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderRow}>
            <Text style={[
              styles.orderLabel,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
              }
            ]}>
              Order #:
            </Text>
            <Text style={[
              styles.orderValue,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
              }
            ]}>
              {order.id?.slice(-8) || 'N/A'}
            </Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={[
              styles.orderLabel,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
              }
            ]}>
              Date:
            </Text>
            <Text style={[
              styles.orderValue,
              {
                color: theme.colors.text,
                ...typography.body,
              }
            ]}>
              {formatDate(order.timestamp || order.createdAt)}
            </Text>
          </View>
          {order.customerName && (
            <View style={styles.orderRow}>
              <Text style={[
                styles.orderLabel,
                {
                  color: theme.colors.textSecondary,
                  ...typography.body,
                }
              ]}>
                Customer:
              </Text>
              <Text style={[
                styles.orderValue,
                {
                  color: theme.colors.text,
                  ...typography.body,
                }
              ]}>
                {order.customerName}
              </Text>
            </View>
          )}
          {order.tableNumber && (
            <View style={styles.orderRow}>
              <Text style={[
                styles.orderLabel,
                {
                  color: theme.colors.textSecondary,
                  ...typography.body,
                }
              ]}>
                Table:
              </Text>
              <Text style={[
                styles.orderValue,
                {
                  color: theme.colors.text,
                  ...typography.body,
                }
              ]}>
                {order.tableNumber}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              ...typography.bodyBold,
              marginBottom: spacing.md,
            }
          ]}>
            Order Items
          </Text>
          {(order.items || []).map((item, idx) => (
            <View key={idx} style={[
              styles.itemRow,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: idx < (order.items?.length - 1) ? 1 : 0,
                paddingBottom: spacing.sm,
                marginBottom: spacing.sm,
              }
            ]}>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.itemName,
                  {
                    color: theme.colors.text,
                    ...typography.bodyBold,
                    marginBottom: spacing.xs,
                  }
                ]}>
                  {item.name} x{item.quantity || item.qty}
                </Text>
                {item.addOns?.length > 0 && (
                  <View style={styles.addOnsList}>
                    {item.addOns.map((addOn, aIdx) => (
                      <Text key={aIdx} style={[
                        styles.addOnText,
                        {
                          color: theme.colors.textSecondary,
                          ...typography.caption,
                        }
                      ]}>
                        + {addOn.name}
                      </Text>
                    ))}
                  </View>
                )}
                {item.specialInstructions && (
                  <Text style={[
                    styles.specialInstructions,
                    {
                      color: theme.colors.warning,
                      ...typography.caption,
                      fontStyle: 'italic',
                      marginTop: spacing.xs,
                    }
                  ]}>
                    Note: {item.specialInstructions}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.itemPrice,
                {
                  color: theme.colors.text,
                  ...typography.bodyBold,
                }
              ]}>
                ₱{((item.totalItemPrice || item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={[
              styles.summaryLabel,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
              }
            ]}>
              Subtotal:
            </Text>
            <Text style={[
              styles.summaryValue,
              {
                color: theme.colors.text,
                ...typography.body,
              }
            ]}>
              ₱{Number(order.subtotal || order.total || 0).toFixed(2)}
            </Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[
                styles.summaryLabel,
                {
                  color: theme.colors.success,
                  ...typography.body,
                }
              ]}>
                Discount ({order.discountCode}):
              </Text>
              <Text style={[
                styles.summaryValue,
                {
                  color: theme.colors.success,
                  ...typography.body,
                }
              ]}>
                -₱{Number(order.discountAmount || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[
            styles.summaryRow,
            styles.totalRow,
            {
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              paddingTop: spacing.md,
              marginTop: spacing.sm,
            }
          ]}>
            <Text style={[
              styles.totalLabel,
              {
                color: theme.colors.text,
                ...typography.h4,
              }
            ]}>
              Total:
            </Text>
            <Text style={[
              styles.totalValue,
              {
                color: theme.colors.primary,
                ...typography.h3,
              }
            ]}>
              ₱{Number(order.total || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <Text style={[
              styles.paymentLabel,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
              }
            ]}>
              Payment Method:
            </Text>
            <Text style={[
              styles.paymentValue,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
                textTransform: 'capitalize',
              }
            ]}>
              {order.paymentMethod || 'Cash'}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={[
              styles.paymentLabel,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
              }
            ]}>
              Status:
            </Text>
            <Text style={[
              styles.paymentValue,
              {
                color: order.status === 'completed' ? theme.colors.success : theme.colors.primary,
                ...typography.bodyBold,
                textTransform: 'capitalize',
              }
            ]}>
              {order.status || 'Pending'}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[
            styles.footerText,
            {
              color: theme.colors.textTertiary,
              ...typography.caption,
              textAlign: 'center',
            }
          ]}>
            Thank you for your order!
          </Text>
          <Text style={[
            styles.footerText,
            {
              color: theme.colors.textTertiary,
              ...typography.caption,
              textAlign: 'center',
              marginTop: spacing.xs,
            }
          ]}>
            Please wait for your order to be prepared.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  receipt: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  header: {
    alignItems: 'center',
    marginBottom: 16
  },
  restaurantName: {
    // Typography handled via theme
  },
  restaurantAddress: {
    // Typography handled via theme
  },
  divider: {
    height: 1,
    marginVertical: 12
  },
  orderInfo: {
    marginBottom: 12
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  orderLabel: {
    // Typography handled via theme
  },
  orderValue: {
    // Typography handled via theme
  },
  itemsSection: {
    marginBottom: 12
  },
  sectionTitle: {
    // Typography handled via theme
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  itemName: {
    // Typography handled via theme
  },
  addOnsList: {
    marginTop: 4
  },
  addOnText: {
    // Typography handled via theme
  },
  specialInstructions: {
    // Typography handled via theme
  },
  itemPrice: {
    // Typography handled via theme
  },
  summarySection: {
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryLabel: {
    // Typography handled via theme
  },
  summaryValue: {
    // Typography handled via theme
  },
  totalRow: {
    // Styled inline
  },
  totalLabel: {
    // Typography handled via theme
  },
  totalValue: {
    // Typography handled via theme
  },
  paymentSection: {
    marginBottom: 12
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  paymentLabel: {
    // Typography handled via theme
  },
  paymentValue: {
    // Typography handled via theme
  },
  footer: {
    marginTop: 12
  },
  footerText: {
    // Typography handled via theme
  }
});

export default ReceiptView;

