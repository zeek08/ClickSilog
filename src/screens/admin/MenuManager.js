import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, Image, ScrollView, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import { storageService } from '../../services/storageService';
import { alertService } from '../../services/alertService';
import { wp, hp, fp } from '../../utils/responsive';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';
import ImageCropper from '../../components/ui/ImageCropper';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import CategoryFilter from '../../components/ui/CategoryFilter';

const MenuManager = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category: '', available: true, imageUrl: '' });
  const [showModal, setShowModal] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, item: null });

  useEffect(() => {
    const u1 = firestoreService.subscribeCollection('menu', { conditions: [], order: ['name', 'asc'], next: setMenu });
    return () => { u1 && u1(); };
  }, []);

  // Extract unique categories from menu items
  useEffect(() => {
    const categoryMap = new Map();
    const categoryOrder = ['silog_meals', 'snacks', 'drinks'];
    const categoryNames = {
      'silog_meals': 'Silog Meals',
      'snacks': 'Snacks',
      'drinks': 'Drinks & Beverages'
    };
    
    menu.forEach(item => {
      const cat = item.category || item.categoryId;
      if (cat && !categoryMap.has(cat)) {
        categoryMap.set(cat, {
          id: cat,
          name: categoryNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')
        });
      }
    });
    
    // Sort by predefined order, then alphabetically
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.id);
      const bIndex = categoryOrder.indexOf(b.id);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    
    setCategories(sortedCategories);
  }, [menu]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: '', price: '', category: categories[0]?.id || 'silog_meals', available: true, imageUrl: '' });
    setSelectedImageUri(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name || '', price: String(item.price || 0), category: item.category || item.categoryId || 'silog_meals', available: item.available !== false && item.status !== 'unavailable', imageUrl: item.imageUrl || '' });
    setSelectedImageUri(item.imageUrl || null);
    setShowModal(true);
  };

  const pickImage = async () => {
    // Prevent multiple simultaneous calls
    if (pickingImage) {
      return;
    }

    try {
      setPickingImage(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alertService.warning('Permission Denied', 'We need camera roll permissions to upload images.');
        setPickingImage(false);
        return;
      }

      // Use allowsEditing: false to avoid the "Already resumed" crash on Android
      // We'll use the custom cropper for editing instead
      // Omit mediaTypes to use default (images only) - avoids deprecation issues
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false, // Disable built-in editing to avoid crash
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // Show custom cropper for cropping
        setSelectedImageUri(imageUri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alertService.error(
        'Error', 
        `Failed to pick image: ${error.message || 'Unknown error'}. Please try again.`
      );
    } finally {
      setPickingImage(false);
    }
  };

  const handleImageCrop = (croppedImageUri) => {
    setSelectedImageUri(croppedImageUri);
    setShowCropper(false);
    setForm((f) => ({ ...f, imageUrl: croppedImageUri }));
  };

  const save = async () => {
    // Validation
    if (!form.name || !form.name.trim()) {
      alertService.error('Error', 'Menu item name is required');
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
    
    if (price > 999999) {
      alertService.error('Error', 'Price is too large (maximum: ₱999,999)');
      return;
    }
    
    if (!form.category || !form.category.trim()) {
      alertService.error('Error', 'Category is required');
      return;
    }
    
    if (form.name.trim().length < 2) {
      alertService.error('Error', 'Menu item name must be at least 2 characters');
      return;
    }
    
    if (form.name.trim().length > 100) {
      alertService.error('Error', 'Menu item name must be 100 characters or less');
      return;
    }
    
    setUploading(true);
    try {
      const id = editingItem?.id || `menu_${Date.now()}`;
      let imageUrl = form.imageUrl;
      
      // Upload image if it's a local URI (not already uploaded)
      if (imageUrl && imageUrl.startsWith('file://')) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          // Firebase Storage accepts Blob directly in React Native
          // Pass the blob and filename separately to avoid modifying the blob
          const fileName = `menu-${id}-${Date.now()}.jpg`;
          const uploadResult = await storageService.uploadMenuItemImage(id, blob, fileName);
          imageUrl = uploadResult.url;
        } catch (error) {
          console.error('Error uploading image:', error);
          alertService.warning('Warning', `Failed to upload image: ${error.message}. Saving without image.`);
          imageUrl = ''; // Clear image URL on error
        }
      }
      
      // Remove description from form data if it exists
      const { description, ...formWithoutDescription } = form;
      await firestoreService.upsertDocument('menu', id, {
        ...formWithoutDescription,
        imageUrl,
        price: Number(form.price),
        updatedAt: new Date().toISOString(),
        createdAt: editingItem?.createdAt || new Date().toISOString()
      });
      
      setShowModal(false);
      setEditingItem(null);
      setForm({ name: '', price: '', category: '', available: true, imageUrl: '' });
      setSelectedImageUri(null);
    } catch (error) {
      console.error('Error saving menu item:', error);
      alertService.error('Error', 'Failed to save menu item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const remove = (item) => {
    setDeleteConfirm({ visible: true, item });
  };

  const confirmDelete = async () => {
    const item = deleteConfirm.item;
    setDeleteConfirm({ visible: false, item: null });
    
    try {
      await firestoreService.deleteDocument('menu', item.id);
      alertService.success('Success', 'Menu item deleted successfully');
    } catch (error) {
      console.error('Delete menu item error:', error);
      alertService.error('Error', 'Failed to delete menu item. Please try again.');
    }
  };

  const toggle = async (item) => {
    await firestoreService.updateDocument('menu', item.id, { available: !item.available });
  };

  const getCategoryName = (catId) => {
    const cat = catId || '';
    return categories.find((c) => c.id === cat)?.name || 'Unknown';
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
                  width: wp(44),
                  height: wp(44),
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
              Menu Management
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
        onPress={openAdd}
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
          Add Menu Item
        </Text>
      </AnimatedButton>

      {/* Search and Category Filter */}
      <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
        {/* Search Input */}
        <View style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: borderRadius.md,
            borderWidth: 1.5,
            marginBottom: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
          }
        ]}>
          <Icon
            name="search"
            library="ionicons"
            size={20}
            color={theme.colors.textSecondary}
            style={{ marginRight: spacing.sm }}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                flex: 1,
                color: theme.colors.text,
                ...typography.body,
                paddingVertical: spacing.sm,
              }
            ]}
            placeholder="Search menu items..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <AnimatedButton
              onPress={() => setSearchQuery('')}
              style={{ padding: spacing.xs }}
            >
              <Icon
                name="close-circle"
                library="ionicons"
                size={20}
                color={theme.colors.textSecondary}
              />
            </AnimatedButton>
          )}
        </View>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId === selectedCategory ? null : catId)}
        />
      </View>

      {/* Filtered Menu Items */}
      {(() => {
        const filteredMenu = useMemo(() => {
          let filtered = menu;
          
          // Filter by category
          if (selectedCategory) {
            filtered = filtered.filter(item => 
              (item.category || item.categoryId) === selectedCategory
            );
          }
          
          // Filter by search query
          if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(item =>
              item.name?.toLowerCase().includes(query)
            );
          }
          
          return filtered;
        }, [menu, selectedCategory, searchQuery]);

        return (
          <FlatList
            data={filteredMenu}
            keyExtractor={(m) => m.id}
            ListEmptyComponent={
              <View style={[styles.empty, { padding: spacing.xxl }]}>
                <Icon
                  name="restaurant-outline"
                  library="ionicons"
                  size={64}
                  color={theme.colors.textTertiary}
                />
                <Text style={[
                  styles.emptyText,
                  {
                    color: theme.colors.text,
                    ...typography.h4,
                    marginTop: spacing.md,
                  }
                ]}>
                  {searchQuery || selectedCategory ? 'No items found' : 'No menu items'}
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
                  {searchQuery || selectedCategory 
                    ? 'Try adjusting your search or filter'
                    : 'Add your first menu item to get started'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
          <View style={[
            styles.card,
            {
              backgroundColor: item.available ? theme.colors.surface : theme.colors.surfaceVariant,
              borderColor: item.available ? theme.colors.border : theme.colors.border,
              borderRadius: borderRadius.xl,
              padding: spacing.md,
              marginBottom: spacing.md,
              marginHorizontal: spacing.md,
              borderWidth: 1.5,
              opacity: item.available ? 1 : 0.6,
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
                    backgroundColor: item.available ? theme.colors.successLight : theme.colors.surfaceVariant,
                    borderColor: item.available ? theme.colors.success : theme.colors.border,
                    borderRadius: borderRadius.sm,
                    paddingVertical: 3,
                    paddingHorizontal: spacing.xs + 2,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: item.available ? 1 : 0.5,
                  }
                ]}>
                  <Icon
                    name={item.available ? 'checkmark-circle' : 'close-circle'}
                    library="ionicons"
                    size={10}
                    color={item.available ? theme.colors.success : theme.colors.textSecondary}
                    responsive={false}
                    hitArea={false}
                    style={{ marginRight: spacing.xs / 2 }}
                  />
                  <Text style={[
                    styles.statusText,
                    {
                      color: item.available ? theme.colors.success : theme.colors.textSecondary,
                      fontSize: 11,
                      fontWeight: '600',
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
                  borderRadius: borderRadius.sm,
                  paddingVertical: 3,
                  paddingHorizontal: spacing.xs + 2,
                  alignSelf: 'flex-start',
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexShrink: 0,
                }
              ]}>
                <Icon
                  name="folder"
                  library="ionicons"
                  size={10}
                  color={theme.colors.textSecondary}
                  responsive={false}
                  hitArea={false}
                  style={{ marginRight: spacing.xs / 2, flexShrink: 0 }}
                />
                <Text 
                  style={[
                    styles.itemCategory,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: 11,
                      fontWeight: '500',
                      flexShrink: 0,
                    }
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getCategoryName(item.category || item.categoryId)}
                </Text>
              </View>
            </View>
            <View style={[
              styles.cardActions,
              {
                borderTopColor: theme.colors.border,
                borderTopWidth: 1,
                marginTop: spacing.md,
                paddingTop: spacing.sm,
                flexDirection: 'row',
              }
            ]}>
              <AnimatedButton
                style={[
                  styles.editBtn,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: borderRadius.sm,
                    paddingVertical: spacing.xs + 1,
                    paddingHorizontal: spacing.sm,
                    flex: 1,
                    marginRight: spacing.xs,
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
                  size={14}
                  color={theme.colors.onPrimary}
                  responsive={false}
                  hitArea={false}
                  style={{ marginRight: 4 }}
                />
                <Text style={[
                  styles.editBtnText,
                  {
                    color: theme.colors.onPrimary,
                    fontSize: 12,
                    fontWeight: '600',
                  }
                ]}>
                  Edit
                </Text>
              </AnimatedButton>
              <AnimatedButton
                style={[
                  styles.disableBtn,
                  {
                    backgroundColor: item.available ? theme.colors.surfaceVariant : theme.colors.success,
                    borderColor: item.available ? theme.colors.border : theme.colors.success,
                    borderRadius: borderRadius.sm,
                    paddingVertical: spacing.xs + 1,
                    paddingHorizontal: spacing.sm,
                    flex: 1,
                    marginRight: spacing.xs,
                    borderWidth: 1,
                  }
                ]}
                onPress={() => toggleAvailable(item)}
              >
                <Icon
                  name={item.available ? 'eye-off' : 'eye'}
                  library="ionicons"
                  size={14}
                  color={item.available ? theme.colors.textSecondary : theme.colors.onPrimary}
                  responsive={false}
                  hitArea={false}
                  style={{ marginRight: 4 }}
                />
                <Text 
                  style={[
                    styles.disableBtnText,
                    {
                      color: item.available ? theme.colors.textSecondary : theme.colors.onPrimary,
                      fontSize: 12,
                      fontWeight: '600',
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
                    borderRadius: borderRadius.sm,
                    paddingVertical: spacing.xs + 1,
                    paddingHorizontal: spacing.sm,
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
                  size={14}
                  color="#FFFFFF"
                  responsive={false}
                  hitArea={false}
                  style={{ marginRight: 4 }}
                />
                <Text style={[
                  styles.deleteBtnText,
                  {
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: '600',
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
          />
        );
      })()}

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
                  width: wp(40),
                  height: wp(40),
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
          <KeyboardAwareScrollView
            enableOnAndroid={true}
            extraScrollHeight={80}
            keyboardShouldPersistTaps="handled"
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.background,
              }
            ]}
            contentContainerStyle={{
              padding: spacing.lg,
            }}
            showsVerticalScrollIndicator={true}
          >
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
              Image
            </Text>
            <View style={[
              styles.imageContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: borderRadius.md,
                borderWidth: 2,
                padding: spacing.md,
                marginBottom: spacing.md,
              }
            ]}>
              {form.imageUrl ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: form.imageUrl }}
                    style={[
                      styles.previewImage,
                      {
                        width: wp(200),
                        height: wp(200),
                        borderRadius: borderRadius.md,
                      }
                    ]}
                    resizeMode="cover"
                  />
                  <AnimatedButton
                    onPress={() => {
                      setForm((f) => ({ ...f, imageUrl: '' }));
                      setSelectedImageUri(null);
                    }}
                    style={[
                      styles.removeImageBtn,
                      {
                        backgroundColor: theme.colors.error,
                        borderRadius: borderRadius.round,
                        width: wp(32),
                        height: wp(32),
                        position: 'absolute',
                        top: -8,
                        right: -8,
                      }
                    ]}
                  >
                    <Icon
                      name="close"
                      library="ionicons"
                      size={18}
                      color={theme.colors.onPrimary}
                    />
                  </AnimatedButton>
                </View>
              ) : (
                <AnimatedButton
                  onPress={pickImage}
                  disabled={pickingImage}
                  style={[
                    styles.uploadImageBtn,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderRadius: borderRadius.md,
                      padding: spacing.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: theme.colors.border,
                      borderStyle: 'dashed',
                      opacity: pickingImage ? 0.5 : 1,
                    }
                  ]}
                >
                  <Icon
                    name="image"
                    library="ionicons"
                    size={48}
                    color={theme.colors.textSecondary}
                    style={{ marginBottom: spacing.sm }}
                  />
                  <Text style={[
                    styles.uploadImageText,
                    {
                      color: theme.colors.textSecondary,
                      ...typography.body,
                    }
                  ]}>
                    Tap to upload image
                  </Text>
                </AnimatedButton>
              )}
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
              Category
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: spacing.sm }}
              contentContainerStyle={{
                flexDirection: 'row',
                paddingRight: spacing.md,
              }}
            >
              {categories.map((c, index) => (
                <AnimatedButton
                  key={c.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: form.category === c.id ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                      borderColor: form.category === c.id ? theme.colors.primary : theme.colors.border,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderWidth: 2,
                      marginRight: index < categories.length - 1 ? spacing.sm : 0,
                      flexShrink: 0,
                    }
                  ]}
                  onPress={() => setForm((f) => ({ ...f, category: c.id }))}
                >
                  <Text 
                    style={[
                      styles.categoryChipText,
                      {
                        color: form.category === c.id ? theme.colors.primary : theme.colors.textSecondary,
                        ...typography.captionBold,
                      }
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {c.name}
                  </Text>
                </AnimatedButton>
              ))}
            </ScrollView>
            <AnimatedButton
              style={[
                styles.saveBtn,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm + 2,
                  marginTop: spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: theme.colors.primary,
                  opacity: uploading ? 0.6 : 1,
                }
              ]}
              onPress={save}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Icon
                  name="save"
                  library="ionicons"
                  size={18}
                  color={theme.colors.onPrimary}
                  responsive={true}
                  hitArea={false}
                  style={{ marginRight: spacing.xs }}
                />
              )}
              <Text style={[
                styles.saveBtnText,
                {
                  color: theme.colors.onPrimary,
                  fontSize: 14,
                  fontWeight: '600',
                }
              ]}>
                {uploading ? 'Saving...' : 'Save'}
              </Text>
            </AnimatedButton>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteConfirm.visible}
        onClose={() => setDeleteConfirm({ visible: false, item: null })}
        onConfirm={confirmDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteConfirm.item?.name || 'this item'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor={theme.colors.error}
        icon="trash-outline"
        iconColor={theme.colors.error}
      />

      {showCropper && selectedImageUri && (
        <ImageCropper
          visible={showCropper}
          imageUri={selectedImageUri}
          onClose={() => {
            setShowCropper(false);
            setSelectedImageUri(null);
          }}
          onCrop={handleImageCrop}
        />
      )}
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
    // padding handled inline with theme spacing
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
  },
  imageContainer: {
    // Styled inline
  },
  imagePreview: {
    position: 'relative',
    alignSelf: 'center',
  },
  previewImage: {
    // Styled inline
  },
  removeImageBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadImageBtn: {
    // Styled inline
  },
  uploadImageText: {
    // Typography handled via theme
  },
});

export default MenuManager;

