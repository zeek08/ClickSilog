import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const MenuManager = ({ navigation }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', categoryId: '', available: true });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const u1 = firestoreService.subscribeCollection('menu', { conditions: [], order: ['name', 'asc'], next: setMenu });
    const u2 = firestoreService.subscribeCollection('menu_categories', { conditions: [], order: ['sortOrder', 'asc'], next: setCategories });
    return () => { u1 && u1(); u2 && u2(); };
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: '', price: '', description: '', categoryId: categories[0]?.id || '', available: true });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name || '', price: String(item.price || 0), description: item.description || '', categoryId: item.categoryId || '', available: item.available !== false });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.price) {
      Alert.alert('Name and price are required');
      return;
    }
    const id = editingItem?.id || `menu_${Date.now()}`;
    await firestoreService.upsertDocument('menu', id, {
      ...form,
      price: Number(form.price),
      updatedAt: new Date().toISOString(),
      createdAt: editingItem?.createdAt || new Date().toISOString()
    });
    setShowModal(false);
    setEditingItem(null);
  };

  const remove = async (item) => {
    Alert.alert('Delete Item', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await firestoreService.deleteDocument('menu', item.id) }
    ]);
  };

  const toggle = async (item) => {
    await firestoreService.updateDocument('menu', item.id, { available: !item.available });
  };

  const getCategoryName = (catId) => categories.find((c) => c.id === catId)?.name || 'Unknown';

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
              name="restaurant"
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
              Menu Manager
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
          Add Menu Item
        </Text>
      </AnimatedButton>

      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
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
              borderWidth: 1.5,
            }
          ]}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={[
                  styles.itemName,
                  {
                    color: theme.colors.text,
                    ...typography.h4,
                    flex: 1,
                    marginRight: spacing.sm,
                  }
                ]}>
                  {item.name}
                </Text>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: item.available ? theme.colors.successLight : theme.colors.errorLight,
                    borderColor: item.available ? theme.colors.success : theme.colors.error,
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
                    name={item.available ? 'checkmark-circle' : 'close-circle'}
                    library="ionicons"
                    size={14}
                    color={item.available ? theme.colors.success : theme.colors.error}
                  />
                  <Text style={[
                    styles.statusText,
                    {
                      color: item.available ? theme.colors.success : theme.colors.error,
                      ...typography.captionBold,
                    }
                  ]}>
                    {item.available ? 'Active' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.itemPrice,
                {
                  color: theme.colors.primary,
                  ...typography.h3,
                  marginTop: spacing.sm,
                  marginBottom: spacing.sm,
                }
              ]}>
                ₱{Number(item.price || 0).toFixed(2)}
              </Text>
              <View style={[
                styles.categoryBadge,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  alignSelf: 'flex-start',
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }
              ]}>
                <Icon
                  name="folder"
                  library="ionicons"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text style={[
                  styles.itemCategory,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.caption,
                  }
                ]}>
                  {getCategoryName(item.categoryId)}
                </Text>
              </View>
              {item.description && (
                <View style={[
                  styles.descContainer,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    marginTop: spacing.xs,
                  }
                ]}>
                  <Text style={[
                    styles.itemDesc,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.caption,
                    }
                  ]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
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
                  name={item.available ? 'eye-off' : 'eye'}
                  library="ionicons"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: spacing.xs }}
                />
                <Text 
                  style={[
                    styles.disableBtnText,
                    {
                      color: '#FFFFFF',
                      ...typography.captionBold,
                    }
                  ]}
                  numberOfLines={1}
                >
                  {item.available ? 'Disable' : 'Enable'}
                </Text>
              </AnimatedButton>
              <AnimatedButton
                style={[
                  styles.deleteBtn,
                  {
                    backgroundColor: theme.colors.error,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm + 2, // Increased padding to accommodate descenders
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
                    fontSize: 13, // Reduced from captionBold (14) to prevent clipping
                    lineHeight: 18, // Increased line height for better vertical spacing
                    fontWeight: '600',
                    letterSpacing: 0.2,
                  }
                ]}>
                  Delete
                </Text>
              </AnimatedButton>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name="restaurant-outline"
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
              No menu items yet
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
              Add your first menu item to get started
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
                {editingItem ? 'Edit Item' : 'Add Item'}
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
                  ...typography.body,
                }
              ]} 
              placeholder="Item name"
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
              Price
            </Text>
            <TextInput 
              value={form.price} 
              onChangeText={(t) => setForm((f) => ({ ...f, price: t }))} 
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  ...typography.body,
                }
              ]} 
              placeholder="0" 
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
              Description
            </Text>
            <TextInput 
              value={form.description} 
              onChangeText={(t) => setForm((f) => ({ ...f, description: t }))} 
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  ...typography.body,
                }
              ]} 
              placeholder="Description" 
              multiline 
              numberOfLines={3}
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
              Category
            </Text>
            <View style={[
              styles.categorySelector,
              {
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
                marginTop: spacing.sm,
              }
            ]}>
              {categories.map((c) => (
                <AnimatedButton
                  key={c.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: form.categoryId === c.id ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                      borderColor: form.categoryId === c.id ? theme.colors.primary : theme.colors.border,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                >
                  <Text style={[
                    styles.categoryChipText,
                    {
                      color: form.categoryId === c.id ? theme.colors.primary : theme.colors.textSecondary,
                      ...typography.captionBold,
                    }
                  ]}>
                    {c.name}
                  </Text>
                </AnimatedButton>
              ))}
            </View>
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
  cardContent: {
    // Styled inline
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  itemName: {
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
  itemPrice: {
    // Typography handled via theme
  },
  categoryBadge: {
    // Styled inline
  },
  itemCategory: {
    // Typography handled via theme
  },
  descContainer: {
    // Styled inline
  },
  itemDesc: {
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
    elevation: 3,
    minWidth: 80,
  },
  disableBtnText: {
    // Typography handled via theme
    flexShrink: 0,
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
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top'
  },
  categorySelector: {
    // Styled inline
  },
  categoryChip: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  categoryChipText: {
    // Typography handled via theme
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  saveBtnText: {
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

export default MenuManager;

