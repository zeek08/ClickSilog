import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import ItemCustomizationModal from './ItemCustomizationModal';
import Icon from './Icon';
import AnimatedButton from './AnimatedButton';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedView = Animated.createAnimatedComponent(View);

const MenuItemCard = ({ item }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { addToCart, calculateTotalPrice } = useCart();
  const [open, setOpen] = useState(false);
  const scale = useSharedValue(1);

  const onConfirm = ({ qty, selectedAddOns, specialInstructions, totalItemPrice }) => {
    addToCart(item, { qty, selectedAddOns, specialInstructions });
    setOpen(false);
  };

  const getCategoryIcon = (categoryId) => {
    if (categoryId === 'silog_meals') return { name: 'restaurant', library: 'ionicons' };
    if (categoryId === 'snacks') return { name: 'fast-food', library: 'ionicons' };
    if (categoryId === 'drinks') return { name: 'water', library: 'ionicons' };
    return { name: 'restaurant-outline', library: 'ionicons' };
  };

  const getCategoryColor = (categoryId) => {
    if (categoryId === 'silog_meals') return theme.colors.primaryContainer;
    if (categoryId === 'snacks') return theme.colors.secondaryLight + '20';
    if (categoryId === 'drinks') return theme.colors.infoLight;
    return theme.colors.surfaceVariant;
  };

  const isVegetarian = item.name?.toLowerCase().includes('tofu') || 
    item.name?.toLowerCase().includes('vegetable') || 
    item.description?.toLowerCase().includes('vegetarian');

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    setOpen(true);
  };

  const categoryIcon = getCategoryIcon(item.categoryId);

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
        <View style={styles.imageContainer}>
          <View style={[
            styles.iconContainer, 
            { 
              backgroundColor: getCategoryColor(item.categoryId),
              borderRadius: borderRadius.round,
              width: 100,
              height: 100,
            }
          ]}>
            <Icon
              name={categoryIcon.name}
              library={categoryIcon.library}
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <View style={[
            styles.labelContainer, 
            { 
              backgroundColor: isVegetarian ? theme.colors.successLight : theme.colors.errorLight,
              borderColor: isVegetarian ? theme.colors.success : theme.colors.error,
              borderRadius: borderRadius.md,
              borderWidth: 1.5,
            }
          ]}>
            <Icon
              name={isVegetarian ? 'leaf' : 'restaurant'}
              library="ionicons"
              size={10}
              color={isVegetarian ? theme.colors.success : theme.colors.error}
            />
            <Text style={[
              styles.label, 
              { color: isVegetarian ? theme.colors.success : theme.colors.error }
            ]}>
              {isVegetarian ? 'VEG' : 'NON-VEG'}
            </Text>
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
      <AnimatedButton
        style={[
          styles.addButton, 
          { 
            backgroundColor: theme.colors.primary,
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
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
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
  addButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default MenuItemCard;
