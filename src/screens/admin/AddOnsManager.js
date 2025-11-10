import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import { alertService } from '../../services/alertService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const categories = ['rice', 'drink', 'extra'];

const AddOnsManager = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [addOns, setAddOns] = useState([]);
  const [filter, setFilter] = useState('rice');
  const [form, setForm] = useState({ name: '', price: '', category: 'rice' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const unsub = firestoreService.subscribeCollection('addons', { conditions: [], order: ['createdAt', 'asc'], next: setAddOns });
    return () => unsub && unsub();
  }, []);

  // Infer category from add-on name or use existing category field
  const getAddOnCategory = (addon) => {
    if (addon.category) return addon.category;
    const name = (addon.name || '').toLowerCase();
    if (name.includes('rice')) return 'rice';
    if (name.includes('drink') || name.includes('lemonade') || name.includes('tea') || name.includes('water')) return 'drink';
    return 'extra'; // Default to extra for items like egg, hotdog, spam
  };

  const filtered = useMemo(() => {
    return addOns.filter((a) => {
      const category = getAddOnCategory(a);
      return category === filter;
    });
  }, [addOns, filter]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: '', price: '', category: filter });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    const category = getAddOnCategory(item);
    setForm({ name: item.name || '', price: String(item.price || 0), category: category || filter });
    setShowModal(true);
  };

  const save = async () => {
    // Validation
    if (!form.name || !form.name.trim()) {
      alertService.error('Error', 'Add-on name is required');
      return;
    }
    
    if (!form.price || form.price.trim() === '') {
      alertService.error('Error', 'Price is required');
      return;
    }
    
    const price = Number(form.price);
    if (isNaN(price) || price < 0) {
      alertService.error('Error', 'Price must be a valid positive number');
      return;
    }
    
    if (price > 9999) {
      alertService.error('Error', 'Price is too large (maximum: ₱9,999)');
      return;
    }
    
    if (form.name.trim().length < 2) {
      alertService.error('Error', 'Add-on name must be at least 2 characters');
      return;
    }
    
    if (form.name.trim().length > 50) {
      alertService.error('Error', 'Add-on name must be 50 characters or less');
      return;
    }
    
    if (!form.category || !categories.includes(form.category)) {
      alertService.error('Error', 'Valid category is required');
      return;
    }
    
    const id = editingItem?.id || `${form.category}_${Date.now()}`;
    await firestoreService.upsertDocument('addons', id, {
      name: form.name,
      price: Number(form.price || 0),
      category: form.category,
      available: editingItem?.available !== false ? (editingItem?.available ?? true) : true,
      linkedTo: ['silog_meals'], // Keep linkedTo for backward compatibility
      updatedAt: new Date().toISOString(),
      createdAt: editingItem?.createdAt || new Date().toISOString()
    });
    setForm({ name: '', price: '', category: filter });
    setEditingItem(null);
    setShowModal(false);
  };

  const toggle = async (a) => {
    await firestoreService.updateDocument('addons', a.id, { available: !a.available });
  };

  const remove = async (a) => {
    alertService.alert('Delete Add-on', `Delete ${a.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await firestoreService.deleteDocument('addons', a.id) }
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
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <AnimatedButton
              onPress={() => navigation.goBack()}
              style={[
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  borderRadius: borderRadius.round,
                  width: 44,
                  height: 44,
                  borderWidth: 1.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.sm,
                }
              ]}
            >
              <Icon
                name="arrow-back"
                library="ionicons"
                size={22}
                color={theme.colors.text}
              />
            </AnimatedButton>
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
              Add Ons Management
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <View style={[
        styles.tabsContainer,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          paddingVertical: spacing.sm,
        }
      ]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={[
            styles.tabs,
            {
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
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
                    borderRadius: borderRadius.sm,
                    paddingVertical: spacing.xs + 2,
                    paddingHorizontal: spacing.sm,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs / 2,
                    shadowColor: filter === c ? theme.colors.primary : undefined,
                    shadowOffset: filter === c ? { width: 0, height: 1 } : undefined,
                    shadowOpacity: filter === c ? 0.08 : undefined,
                    shadowRadius: filter === c ? 2 : undefined,
                    elevation: filter === c ? 1 : 0,
                  }
                ]}
                onPress={() => { setFilter(c); setForm((f) => ({ ...f, category: c })); }}
              >
                <Icon
                  name={categoryIcon.name}
                  library={categoryIcon.library}
                  size={14}
                  color={filter === c ? theme.colors.onPrimary : theme.colors.textSecondary}
                  responsive={false}
                  hitArea={false}
                />
                <Text style={[
                  styles.tabText,
                  {
                    color: filter === c ? theme.colors.onPrimary : theme.colors.textSecondary,
                    fontSize: 13,
                    fontWeight: filter === c ? '600' : '500',
                  }
                ]}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </AnimatedButton>
            );
          })}
        </ScrollView>
      </View>

      <AnimatedButton
        style={[
          styles.addButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.sm + spacing.xs,
            paddingHorizontal: spacing.md,
            margin: spacing.md,
            marginBottom: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 1,
          }
        ]}
        onPress={() => openAdd()}
      >
        <Icon
          name="add"
          library="ionicons"
          size={18}
          color={theme.colors.onPrimary}
          responsive={false}
          hitArea={false}
        />
        <Text style={[
          styles.addButtonText,
          {
            color: theme.colors.onPrimary,
            fontSize: 14,
            fontWeight: '600',
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
          const category = getAddOnCategory(item);
          const categoryIcon = getCategoryIcon(category);
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
                    borderRadius: borderRadius.sm,
                    paddingVertical: 3,
                    paddingHorizontal: spacing.xs + 2,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs / 2,
                  }
                ]}>
                  <Icon
                    name={item.available ? 'checkmark-circle' : 'close-circle'}
                    library="ionicons"
                    size={11}
                    color={item.available ? theme.colors.success : theme.colors.error}
                    responsive={false}
                    hitArea={false}
                    style={{ marginRight: spacing.xs / 2 }}
                  />
                  <Text style={[
                    styles.statusText,
                    {
                      color: item.available ? theme.colors.success : theme.colors.error,
                      fontSize: 11,
                      fontWeight: '600',
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
                  borderRadius: borderRadius.sm,
                  paddingVertical: spacing.xs + 2,
                  paddingHorizontal: spacing.sm,
                  marginTop: spacing.xs,
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }
              ]}>
                <Icon
                  name="cash"
                  library="ionicons"
                  size={14}
                  color={theme.colors.primary}
                  responsive={false}
                  hitArea={false}
                />
                <Text style={[
                  styles.meta,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '500',
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
                  responsive={false}
                  hitArea={false}
                />
                <Text style={[
                  styles.meta,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '500',
                    textTransform: 'capitalize',
                  }
                ]}>
                  {category}
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
                      borderRadius: borderRadius.sm,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      flex: 1,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  ]}
                  onPress={() => openEdit(item)}
                >
                  <Icon
                    name="create"
                    library="ionicons"
                    size={16}
                    color={theme.colors.onPrimary}
                    responsive={false}
                    hitArea={false}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.btnText,
                    {
                      color: theme.colors.onPrimary,
                      fontSize: 13,
                      fontWeight: '600',
                    }
                  ]}>
                    Edit
                  </Text>
                </AnimatedButton>
                <AnimatedButton
                  style={[
                    styles.btn,
                    {
                      backgroundColor: item.available ? theme.colors.surfaceVariant : theme.colors.success,
                      borderColor: item.available ? theme.colors.border : theme.colors.success,
                      borderRadius: borderRadius.sm,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      flex: 1,
                      borderWidth: 1,
                    }
                  ]}
                  onPress={() => toggle(item)}
                >
                  <Icon
                    name={item.available ? 'eye-off' : 'eye'}
                    library="ionicons"
                    size={16}
                    color={item.available ? theme.colors.textSecondary : theme.colors.onPrimary}
                    responsive={false}
                    hitArea={false}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.btnText,
                    {
                      color: item.available ? theme.colors.textSecondary : theme.colors.onPrimary,
                      fontSize: 13,
                      fontWeight: '600',
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
                      borderRadius: borderRadius.sm,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      flex: 1,
                      shadowColor: theme.colors.error,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  ]}
                  onPress={() => remove(item)}
                >
                  <Icon
                    name="trash"
                    library="ionicons"
                    size={16}
                    color="#FFFFFF"
                    responsive={false}
                    hitArea={false}
                    style={{ marginRight: 4 }}
                  />
                    <Text 
                      style={[
                        styles.btnText,
                        {
                          color: '#FFFFFF',
                          fontSize: 13,
                          fontWeight: '600',
                        }
                      ]}
                      numberOfLines={1}
                    >
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
              paddingTop: insets.top + spacing.md,
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.sm,
            }
          ]}>
            <View style={styles.modalTitleRow}>
              <Icon
                name={editingItem ? 'create' : 'add-circle'}
                library="ionicons"
                size={20}
                color={theme.colors.primary}
                responsive={false}
                hitArea={false}
                style={{ marginRight: spacing.xs }}
              />
              <Text style={[
                styles.modalTitle,
                {
                  color: theme.colors.text,
                  fontSize: 18,
                  fontWeight: '600',
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
                  width: 36,
                  height: 36,
                }
              ]}
            >
              <Icon
                name="close"
                library="ionicons"
                size={18}
                color={theme.colors.onPrimary}
                responsive={false}
                hitArea={false}
              />
            </AnimatedButton>
          </View>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.background,
              padding: spacing.md,
            }
          ]}>
            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: spacing.xs,
                marginTop: spacing.sm,
              }
            ]}>
              Category
            </Text>
            <View style={[
              styles.categorySelector,
              {
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.xs,
                marginTop: spacing.xs,
                marginBottom: spacing.sm,
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
                        borderRadius: borderRadius.sm,
                        paddingVertical: spacing.xs + 2,
                        paddingHorizontal: spacing.sm,
                        borderWidth: 1.5,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs / 2,
                      }
                    ]}
                    onPress={() => setForm((f) => ({ ...f, category: c }))}
                  >
                    <Icon
                      name={categoryIcon.name}
                      library={categoryIcon.library}
                      size={12}
                      color={form.category === c ? theme.colors.primary : theme.colors.textSecondary}
                      responsive={false}
                      hitArea={false}
                    />
                    <Text style={[
                      styles.categoryChipText,
                      {
                        color: form.category === c ? theme.colors.primary : theme.colors.textSecondary,
                        fontSize: 12,
                        fontWeight: '600',
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
                fontSize: 13,
                fontWeight: '600',
                marginBottom: spacing.xs,
                marginTop: spacing.sm,
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
                  borderRadius: borderRadius.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderWidth: 1.5,
                  fontSize: 14,
                  fontWeight: '400',
                }
              ]}
              placeholder="Add-on name"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: spacing.xs,
                marginTop: spacing.sm,
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
                  borderRadius: borderRadius.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderWidth: 1.5,
                  fontSize: 14,
                  fontWeight: '400',
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
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm + spacing.xs,
                  marginTop: spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }
              ]}
              onPress={save}
            >
              <Icon
                name="save"
                library="ionicons"
                size={16}
                color={theme.colors.onPrimary}
                responsive={false}
                hitArea={false}
              />
              <Text style={[
                styles.saveBtnText,
                {
                  color: theme.colors.onPrimary,
                  fontSize: 14,
                  fontWeight: '600',
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
  tabsContainer: {
    // Styled inline
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
    // padding handled inline with theme spacing
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

