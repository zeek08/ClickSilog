import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const categories = ['rice', 'drink', 'extra'];

const AddOnsManager = () => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [addOns, setAddOns] = useState([]);
  const [filter, setFilter] = useState('rice');
  const [form, setForm] = useState({ name: '', price: '', category: 'rice' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const unsub = firestoreService.subscribeCollection('add_ons', { conditions: [], order: ['createdAt', 'asc'], next: setAddOns });
    return () => unsub && unsub();
  }, []);

  const filtered = useMemo(() => addOns.filter((a) => a.category === filter), [addOns, filter]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: '', price: '', category: filter });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name || '', price: String(item.price || 0), category: item.category || filter });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.price) {
      Alert.alert('Name and price are required');
      return;
    }
    const id = editingItem?.id || `${form.category}_${Date.now()}`;
    await firestoreService.upsertDocument('add_ons', id, {
      name: form.name,
      price: Number(form.price || 0),
      category: form.category,
      available: editingItem?.available !== false ? (editingItem?.available ?? true) : true,
      updatedAt: new Date().toISOString(),
      createdAt: editingItem?.createdAt || new Date().toISOString()
    });
    setForm({ name: '', price: '', category: filter });
    setEditingItem(null);
    setShowModal(false);
  };

  const toggle = async (a) => {
    await firestoreService.updateDocument('add_ons', a.id, { available: !a.available });
  };

  const remove = async (a) => {
    Alert.alert('Delete Add-on', `Delete ${a.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await firestoreService.deleteDocument('add_ons', a.id) }
    ]);
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
          paddingTop: spacing.xl + spacing.sm,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Icon
              name="add-circle"
              library="ionicons"
              size={28}
              color={theme.colors.secondary}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[
              styles.headerTitle,
              {
                color: theme.colors.text,
                ...typography.h2,
              }
            ]}>
              Add-ons Manager
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={[
          styles.tabs,
          {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            gap: spacing.md,
          }
        ]}
      >
        {categories.map((c) => {
          const categoryIcon = getCategoryIcon(c);
          return (
            <AnimatedButton
            key={c}
              style={[
                styles.tab,
                {
                  backgroundColor: filter === c ? theme.colors.primary : theme.colors.surfaceVariant,
                  borderColor: filter === c ? theme.colors.primary : theme.colors.border,
                  borderRadius: borderRadius.lg,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  minHeight: 50, // Increased minHeight to ensure icon + text visibility
                  borderWidth: 1.5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  shadowColor: filter === c ? theme.colors.primary : undefined,
                }
              ]}
            onPress={() => { setFilter(c); setForm((f) => ({ ...f, category: c })); }}
            >
              <Icon
                name={categoryIcon.name}
                library={categoryIcon.library}
                size={20}
                color={filter === c ? theme.colors.onPrimary : theme.colors.textSecondary}
              />
              <Text style={[
                styles.tabText,
                {
                  color: filter === c ? theme.colors.onPrimary : theme.colors.textSecondary,
                  ...typography.captionBold,
                }
              ]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </AnimatedButton>
          );
        })}
      </ScrollView>

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
        onPress={() => openAdd()}
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
          Add New Add-on
        </Text>
      </AnimatedButton>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        renderItem={({ item }) => {
          const categoryIcon = getCategoryIcon(item.category);
          return (
            <View style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
                marginBottom: spacing.md,
                marginHorizontal: spacing.md,
                borderWidth: 1.5,
                minHeight: 160,
              }
            ]}>
            <View style={styles.cardHeader}>
                <Text style={[
                  styles.title,
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
                    {item.available ? 'Active' : 'Hidden'}
                  </Text>
              </View>
            </View>
              <View style={[
                styles.metaContainer,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginTop: spacing.sm,
                  marginBottom: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }
              ]}>
                <Icon
                  name="cash"
                  library="ionicons"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={[
                  styles.meta,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.caption,
                    marginRight: spacing.sm,
                  }
                ]}>
                  ₱{Number(item.price || 0).toFixed(2)}
                </Text>
                <Icon
                  name={categoryIcon.name}
                  library={categoryIcon.library}
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text style={[
                  styles.meta,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.caption,
                    textTransform: 'capitalize',
                  }
                ]}>
                  {item.category}
                </Text>
              </View>
              <View style={[
                styles.row,
                {
                  borderTopColor: theme.colors.border,
                  borderTopWidth: 1,
                  marginTop: spacing.sm,
                  paddingTop: spacing.md,
                  flexDirection: 'row',
                  gap: spacing.sm,
                }
              ]}>
                <AnimatedButton
                  style={[
                    styles.btn,
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
                    styles.btnText,
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
                    styles.btn,
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
                  <Text style={[
                    styles.btnText,
                    {
                      color: '#FFFFFF',
                      ...typography.captionBold,
                    }
                  ]}>
                    {item.available ? 'Disable' : 'Enable'}
                  </Text>
                </AnimatedButton>
                <AnimatedButton
                  style={[
                    styles.btn,
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
                    styles.btnText,
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
        contentContainerStyle={[
          styles.list,
          {
            padding: spacing.md,
            paddingTop: spacing.sm,
          }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { padding: spacing.xxl }]}>
            <Icon
              name={getCategoryIcon(filter).name}
              library={getCategoryIcon(filter).library}
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
              No {filter} add-ons yet
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
              Add your first {filter} add-on above
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
                {editingItem ? 'Edit Add-on' : 'Add New Add-on'}
              </Text>
            </View>
            <AnimatedButton
              onPress={() => { setShowModal(false); setEditingItem(null); setForm({ name: '', price: '', category: filter }); }}
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
              Category
            </Text>
            <View style={[
              styles.categorySelector,
              {
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
                marginTop: spacing.sm,
                marginBottom: spacing.md,
              }
            ]}>
              {categories.map((c) => {
                const categoryIcon = getCategoryIcon(c);
                return (
                  <AnimatedButton
                    key={c}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: form.category === c ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                        borderColor: form.category === c ? theme.colors.primary : theme.colors.border,
                        borderRadius: borderRadius.md,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        borderWidth: 2,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }
                    ]}
                    onPress={() => setForm((f) => ({ ...f, category: c }))}
                  >
                    <Icon
                      name={categoryIcon.name}
                      library={categoryIcon.library}
                      size={16}
                      color={form.category === c ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text style={[
                      styles.categoryChipText,
                      {
                        color: form.category === c ? theme.colors.primary : theme.colors.textSecondary,
                        ...typography.captionBold,
                      }
                    ]}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </Text>
                  </AnimatedButton>
                );
              })}
            </View>
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
                  borderWidth: 2,
                  ...typography.body,
                }
              ]}
              placeholder="Add-on name"
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
                  borderWidth: 2,
                  ...typography.body,
                }
              ]}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textTertiary}
            />
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
  tabs: {
    // Padding handled inline
  },
  tab: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  tabText: {
    // Typography handled via theme
  },
  form: {
    // Styled inline
  },
  input: {
    // Styled inline
  },
  addBtn: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  addBtnText: {
    // Typography handled via theme
  },
  list: {
    // Padding handled inline
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
    alignItems: 'center'
  },
  title: {
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
  metaContainer: {
    // Styled inline
  },
  meta: {
    // Typography handled via theme
  },
  row: {
    // Styled inline
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3
  },
  btnText: {
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  saveBtnText: {
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
  }
});

export default AddOnsManager;

