import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../contexts/CartContext';

const HeaderCartButton = () => {
  const navigation = useNavigation();
  const { items } = useCart();
  const count = items.reduce((n, i) => n + (i.qty || 0), 0);

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate('Cart')} activeOpacity={0.7}>
      <Text style={styles.icon}>🛒</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 20
  },
  icon: {
    fontSize: 18
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  }
});

export default HeaderCartButton;
