import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const DISCOUNT_TYPES = [
  { id: 'percentage', label: 'Percentage (%)', icon: 'percent' },
  { id: 'fixed', label: 'Fixed Amount (₱)', icon: 'cash' }
];

const DiscountManager = () => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    code: '', 
    type: 'percentage', 
    value: '', 
    minOrder: '',
    maxDiscount: '',
    active: true,
    validFrom: '',
    validUntil: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const unsub = firestoreService.subscribeCollection('discounts', { 
      conditions: [], 
      order: ['createdAt', 'desc'], 
      next: setDiscounts 
    });
    return () => unsub && unsub();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ 
      name: '', 
      code: '', 
      type: 'percentage', 
      value: '', 
      minOrder: '',
      maxDiscount: '',
      active: true,
      validFrom: '',
      validUntil: ''
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ 
      name: item.name || '', 
      code: item.code || '', 
      type: item.type || 'percentage', 
      value: String(item.value || 0), 
      minOrder: String(item.minOrder || 0),
      maxDiscount: String(item.maxDiscount || ''),
      active: item.active !== false,
      validFrom: item.validFrom || '',
      validUntil: item.validUntil || ''
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.code || !form.value) {
      Alert.alert('Error', 'Name, code, and value are required');
      return;
    }
    if (form.type === 'percentage' && (Number(form.value) < 0 || Number(form.value) > 100)) {
      Alert.alert('Error', 'Percentage must be between 0 and 100');
      return;
    }
    
    const id = editingItem?.id || `discount_${Date.now()}`;
    await firestoreService.upsertDocument('discounts', id, {
      name: form.name,
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder || 0),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      active: form.active,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      updatedAt: new Date().toISOString(),
      createdAt: editingItem?.createdAt || new Date().toISOString()
    });
    setShowModal(false);
    setEditingItem(null);
  };

  const toggle = async (item) => {
    await firestoreService.updateDocument('discounts', item.id, { active: !item.active });
  };

  const remove = async (item) => {
    Alert.alert('Delete Discount', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await firestoreService.deleteDocument('discounts', item.id) }
    ]);
  };

  const isDiscountValid = (discount) => {
    if (!discount.active) return false;
    const now = new Date();
    if (discount.validFrom && new Date(discount.validFrom) > now) return false;
    if (discount.validUntil && new Date(discount.validUntil) < now) return false;
    return true;
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
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Icon
              name="pricetag"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[
              styles.headerTitle,
              {
                color: theme.colors.text,
                ...typography.h2,
              }
            ]}>
              Discount Manager
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <AnimatedButton
        style={[
          styles.addButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            margin: spacing.md,
            marginBottom: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            shadowColor: theme.colors.primary,
          }
        ]}
        onPress={openAdd}
      >
        <Icon
          name="add"
          library="ionicons"
          size={24}
          color={theme.colors.onPrimary}
        />
        <Text style={[
          styles.addButtonText,
          {
            color: theme.colors.onPrimary,
            ...typography.bodyBold,
          }
        ]}>
          Add New Discount
        </Text>
      </AnimatedButton>

      <FlatList
        data={discounts}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => {
          const valid = isDiscountValid(item);
          return (
            <View style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: borderRadius.xl,
                padding: spacing.md,
                marginBottom: spacing.md,
                marginHorizontal: spacing.md,
                borderWidth: 1.5,
              }
            ]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.itemName,
                    {
                      color: theme.colors.text,
                      ...typography.h4,
                      marginBottom: spacing.xs,
                    }
                  ]}>
                    {item.name}
                  </Text>
                  <View style={[
                    styles.codeBadge,
                    {
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.xs,
                      paddingHorizontal: spacing.sm,
                      alignSelf: 'flex-start',
                      marginBottom: spacing.sm,
                    }
                  ]}>
                    <Text style={[
                      styles.codeText,
                      {
                        color: theme.colors.primary,
                        ...typography.captionBold,
                      }
                    ]}>
                      Code: {item.code}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: valid ? theme.colors.successLight : theme.colors.errorLight,
                    borderColor: valid ? theme.colors.success : theme.colors.error,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    borderWidth: 1.5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }
                ]}>
                  <Icon
                    name={valid ? 'checkmark-circle' : 'close-circle'}
                    library="ionicons"
                    size={14}
                    color={valid ? theme.colors.success : theme.colors.error}
                  />
                  <Text style={[
                    styles.statusText,
                    {
                      color: valid ? theme.colors.success : theme.colors.error,
                      ...typography.captionBold,
                    }
                  ]}>
                    {valid ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              
              <View style={[
                styles.discountValue,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }
              ]}>
                <Text style={[
                  styles.valueText,
                  {
                    color: theme.colors.primary,
                    ...typography.h3,
                  }
                ]}>
                  {item.type === 'percentage' ? `${item.value}%` : `₱${Number(item.value).toFixed(2)}`}
                </Text>
                {item.minOrder > 0 && (
                  <Text style={[
                    styles.minOrderText,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.caption,
                      marginTop: spacing.xs,
                    }
                  ]}>
                    Min order: ₱{Number(item.minOrder).toFixed(2)}
                  </Text>
                )}
              </View>

              <View style={[
                styles.cardActions,
                {
                  borderTopColor: theme.colors.border,
                  borderTopWidth: 1,
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  flexDirection: 'row',
                  gap: spacing.sm,
                }
              ]}>
                <AnimatedButton
                  style={[
                    styles.editBtn,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      flex: 1,
                      shadowColor: theme.colors.primary,
                    }
                  ]}
                  onPress={() => openEdit(item)}
                >
                  <Icon
                    name="create"
                    library="ionicons"
                    size={16}
                    color={theme.colors.onPrimary}
                    style={{ marginRight: spacing.xs }}
                  />
                  <Text style={[
                    styles.editBtnText,
                    {
                      color: theme.colors.onPrimary,
                      ...typography.captionBold,
                    }
                  ]}>
                    Edit
                  </Text>
                </AnimatedButton>
                <AnimatedButton
                  style={[
                    styles.disableBtn,
                    {
                      backgroundColor: theme.colors.warning,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      flex: 1,
                      shadowColor: theme.colors.warning,
                    }
                  ]}
                  onPress={() => toggle(item)}
                >
                  <Icon
                    name={item.active ? 'eye-off' : 'eye'}
                    library="ionicons"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: spacing.xs }}
                  />
                  <Text style={[
                    styles.disableBtnText,
                    {
                      color: '#FFFFFF',
                      ...typography.captionBold,
                    }
                  ]}>
                    {item.active ? 'Disable' : 'Enable'}
                  </Text>
                </AnimatedButton>
                <AnimatedButton
                  style={[
                    styles.deleteBtn,
                    {
                      backgroundColor: theme.colors.error,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      flex: 1,
                      shadowColor: theme.colors.error,
                    }
                  ]}
                  onPress={() => remove(item)}
                >
                  <Icon
                    name="trash"
                    library="ionicons"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: spacing.xs }}
                  />
                  <Text style={[
                    styles.deleteBtnText,
                    {
                      color: '#FFFFFF',
                      ...typography.captionBold,
                    }
                  ]}>
                    Delete
                  </Text>
                </AnimatedButton>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name="pricetag-outline"
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
              No discounts yet
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
              Add your first discount above
            </Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <View style={[
            styles.modalHeader,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
              paddingTop: spacing.xl + spacing.sm,
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.md,
            }
          ]}>
            <View style={styles.modalTitleRow}>
              <Icon
                name={editingItem ? 'create' : 'add-circle'}
                library="ionicons"
                size={24}
                color={theme.colors.primary}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.modalTitle,
                {
                  color: theme.colors.text,
                  ...typography.h2,
                }
              ]}>
                {editingItem ? 'Edit Discount' : 'Add New Discount'}
              </Text>
            </View>
            <AnimatedButton
              onPress={() => setShowModal(false)}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: theme.colors.error,
                  borderRadius: borderRadius.round,
                  width: 40,
                  height: 40,
                }
              ]}
            >
              <Icon
                name="close"
                library="ionicons"
                size={22}
                color={theme.colors.onPrimary}
              />
            </AnimatedButton>
          </View>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.background,
              padding: spacing.lg,
            }
          ]}>
            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
                marginBottom: spacing.sm,
                marginTop: spacing.md,
              }
            ]}>
              Discount Type
            </Text>
            <View style={[
              styles.typeSelector,
              {
                flexDirection: 'row',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }
            ]}>
              {DISCOUNT_TYPES.map((type) => (
                <AnimatedButton
                  key={type.id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: form.type === type.id ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                      borderColor: form.type === type.id ? theme.colors.primary : theme.colors.border,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderWidth: 2,
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.xs,
                    }
                  ]}
                  onPress={() => setForm((f) => ({ ...f, type: type.id }))}
                >
                  <Icon
                    name={type.icon}
                    library="ionicons"
                    size={16}
                    color={form.type === type.id ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.typeChipText,
                    {
                      color: form.type === type.id ? theme.colors.primary : theme.colors.textSecondary,
                      ...typography.captionBold,
                    }
                  ]}>
                    {type.label}
                  </Text>
                </AnimatedButton>
              ))}
            </View>

            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
                marginBottom: spacing.sm,
              }
            ]}>
              Name
            </Text>
            <TextInput
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  borderWidth: 2,
                  ...typography.body,
                }
              ]}
              placeholder="Discount name"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
                marginBottom: spacing.sm,
                marginTop: spacing.md,
              }
            ]}>
              Code
            </Text>
            <TextInput
              value={form.code}
              onChangeText={(t) => setForm((f) => ({ ...f, code: t.toUpperCase() }))}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  borderWidth: 2,
                  ...typography.body,
                }
              ]}
              placeholder="DISCOUNT10"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="characters"
            />

            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
                marginBottom: spacing.sm,
                marginTop: spacing.md,
              }
            ]}>
              Value {form.type === 'percentage' ? '(%)' : '(₱)'}
            </Text>
            <TextInput
              value={form.value}
              onChangeText={(t) => setForm((f) => ({ ...f, value: t }))}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  borderWidth: 2,
                  ...typography.body,
                }
              ]}
              placeholder={form.type === 'percentage' ? '10' : '50'}
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                ...typography.bodyBold,
                marginBottom: spacing.sm,
                marginTop: spacing.md,
              }
            ]}>
              Minimum Order (₱)
            </Text>
            <TextInput
              value={form.minOrder}
              onChangeText={(t) => setForm((f) => ({ ...f, minOrder: t }))}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  borderWidth: 2,
                  ...typography.body,
                }
              ]}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textTertiary}
            />

            {form.type === 'percentage' && (
              <>
                <Text style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                    ...typography.bodyBold,
                    marginBottom: spacing.sm,
                    marginTop: spacing.md,
                  }
                ]}>
                  Maximum Discount (₱) <Text style={{ ...typography.caption, color: theme.colors.textTertiary }}>(Optional)</Text>
                </Text>
                <TextInput
                  value={form.maxDiscount}
                  onChangeText={(t) => setForm((f) => ({ ...f, maxDiscount: t }))}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      borderWidth: 2,
                      ...typography.body,
                    }
                  ]}
                  placeholder="100"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </>
            )}

            <AnimatedButton
              style={[
                styles.saveBtn,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.lg,
                  paddingVertical: spacing.lg,
                  marginTop: spacing.xl,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  shadowColor: theme.colors.primary,
                }
              ]}
              onPress={save}
            >
              <Icon
                name="save"
                library="ionicons"
                size={22}
                color={theme.colors.onPrimary}
              />
              <Text style={[
                styles.saveBtnText,
                {
                  color: theme.colors.onPrimary,
                  ...typography.bodyBold,
                }
              ]}>
                Save
              </Text>
            </AnimatedButton>
          </View>
        </View>
      </Modal>
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
  addButton: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  addButtonText: {
    // Typography handled via theme
  },
  list: {
    paddingTop: 8
  },
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  itemName: {
    // Typography handled via theme
  },
  codeBadge: {
    // Styled inline
  },
  codeText: {
    // Typography handled via theme
  },
  statusBadge: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  statusText: {
    // Typography handled via theme
  },
  discountValue: {
    // Styled inline
  },
  valueText: {
    // Typography handled via theme
  },
  minOrderText: {
    // Typography handled via theme
  },
  cardActions: {
    // Styled inline
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  editBtnText: {
    // Typography handled via theme
  },
  disableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  disableBtnText: {
    // Typography handled via theme
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  deleteBtnText: {
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
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  modalTitle: {
    // Typography handled via theme
  },
  closeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  modalContent: {
    padding: 24
  },
  label: {
    marginBottom: 8,
    marginTop: 16
  },
  input: {
    marginBottom: 8
  },
  typeSelector: {
    // Styled inline
  },
  typeChip: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  typeChipText: {
    // Typography handled via theme
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  saveBtnText: {
    // Typography handled via theme
  }
});

export default DiscountManager;

