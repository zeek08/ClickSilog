import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { scale } from '../../utils/responsive';
import ItemCustomizationModal from './ItemCustomizationModal';
import Icon from './Icon';
import AnimatedButton from './AnimatedButton';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedView = Animated.createAnimatedComponent(View);

const MenuItemCard = ({ item }) => {
  const { theme, spacing, borderRadius, typography, themeMode } = useTheme();
  const { addToCart, calculateTotalPrice, items, removeFromCart, updateQty } = useCart();
  const [open, setOpen] = useState(false);
  const scaleAnim = useSharedValue(1);
  
  // Check if item is already in cart (by id only, not considering add-ons)
  const cartItem = items.find(cartItem => cartItem.id === item.id);
  const isInCart = !!cartItem;

  const onConfirm = ({ qty, selectedAddOns, specialInstructions, totalItemPrice }) => {
    addToCart(item, { qty, selectedAddOns, specialInstructions });
    setOpen(false);
  };

  const getCategoryIcon = (categoryId) => {
    const cat = categoryId || '';
    if (cat === 'silog_meals' || cat === 'meal' || cat === 'silog') return { name: 'restaurant', library: 'ionicons' };
    if (cat === 'snacks' || cat === 'snack') return { name: 'fast-food', library: 'ionicons' };
    if (cat === 'drinks' || cat === 'drink') return { name: 'water', library: 'ionicons' };
    return { name: 'restaurant-outline', library: 'ionicons' };
  };

  const getCategoryColor = (categoryId) => {
    const cat = categoryId || '';
    if (cat === 'silog_meals' || cat === 'meal' || cat === 'silog') return theme.colors.primaryContainer;
    if (cat === 'snacks' || cat === 'snack') {
      // Use a more visible color in dark mode
      return themeMode === 'dark' 
        ? theme.colors.secondary + '30' 
        : theme.colors.secondaryLight + '20';
    }
    if (cat === 'drinks' || cat === 'drink') {
      // Use a more visible color in dark mode
      return themeMode === 'dark'
        ? theme.colors.info + '30'
        : theme.colors.infoLight;
    }
    return theme.colors.surface;
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePress = () => {
    scaleAnim.value = withSpring(0.98, { damping: 15, stiffness: 300 }, () => {
      scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    setOpen(true);
  };

  const categoryIcon = getCategoryIcon(item.category || item.categoryId);
  const hasImage = item?.imageUrl && item.imageUrl.trim() !== '';

  return (
    <AnimatedView style={[
      styles.card, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        margin: spacing.sm,
      },
      cardAnimatedStyle
    ]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={{ flex: 1 }}>
        <View style={[styles.imageContainer, { backgroundColor: 'transparent' }]}>
          <View style={[
            styles.iconContainer, 
            { 
              backgroundColor: hasImage ? 'transparent' : getCategoryColor(item.category || item.categoryId),
              borderRadius: borderRadius.round,
              width: 100,
              height: 100,
              overflow: 'hidden',
            }
          ]}>
            {hasImage ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: borderRadius.round,
                }}
                resizeMode="cover"
              />
            ) : (
            <Icon
              name={categoryIcon.name}
              library={categoryIcon.library}
              size={48}
              responsive={false}
                color={
                  (item.category || item.categoryId) === 'snacks' || (item.category || item.categoryId) === 'snack'
                    ? theme.colors.secondary || '#7C3AED' // Purple for snacks
                    : (item.category || item.categoryId) === 'drinks' || (item.category || item.categoryId) === 'drink'
                    ? theme.colors.info || '#3B82F6' // Blue for drinks
                    : theme.colors.primary // Yellow for silog meals
                }
              />
            )}
          </View>
        </View>
        <View style={styles.content}>
          <Text 
            style={[
              styles.title, 
              { 
                color: theme.colors.text,
                ...typography.bodyBold,
                marginBottom: spacing.sm,
              }
            ]} 
            numberOfLines={2}
          >
            {item.name.replace(/\s*\((Small|Large)\)\s*/i, '')}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={[
              styles.price, 
              { 
                color: theme.colors.primary,
                ...typography.h4,
              }
            ]}>
              ₱{(item.price || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={[styles.buttonContainer, { justifyContent: 'space-between' }]}>
        {isInCart ? (
          <AnimatedButton
            style={[
              styles.removeButton, 
              { 
                backgroundColor: theme.colors.error,
                borderWidth: 1.5,
                borderColor: theme.colors.error + '60',
                borderRadius: borderRadius.round,
                width: 48,
                height: 48,
                shadowColor: theme.colors.error,
              }
            ]}
            onPress={() => {
              if (cartItem.qty > 1) {
                updateQty(cartItem.id, cartItem.qty - 1);
              } else {
                removeFromCart(cartItem.id);
              }
            }}
          >
            <Icon
              name="remove"
              library="ionicons"
              size={28}
              color={theme.colors.onPrimary}
            />
          </AnimatedButton>
        ) : (
          <View style={{ width: 48 }} />
        )}
      <AnimatedButton
        style={[
          styles.addButton, 
          { 
            backgroundColor: theme.colors.primary,
              borderWidth: 1.5,
              borderColor: theme.colors.primaryDark || '#F9A825',
            borderRadius: borderRadius.round,
            width: 48,
            height: 48,
            shadowColor: theme.colors.primary,
          }
        ]}
        onPress={handlePress}
      >
        <Icon
          name="add"
          library="ionicons"
          size={28}
          color={theme.colors.onPrimary}
        />
      </AnimatedButton>
      </View>
      {open && (
        <ItemCustomizationModal
          visible={open}
          onClose={() => setOpen(false)}
          item={item}
          onConfirm={onConfirm}
          calculateTotalPrice={calculateTotalPrice}
        />
      )}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labelContainer: {
    position: 'absolute',
    // top, right, padding, gap handled inline with theme spacing
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  title: {
    minHeight: 44,
    lineHeight: 20,
  },
  priceContainer: {
    marginTop: 8,
  },
  price: {
    // Typography handled via theme
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default memo(MenuItemCard);
