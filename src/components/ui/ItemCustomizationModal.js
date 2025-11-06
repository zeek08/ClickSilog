import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { firestoreService } from '../../services/firestoreService';

const SelectableRow = ({ label, price, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.row, selected && styles.rowSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>{label}</Text>
    </View>
    <Text style={[styles.rowPrice, selected && styles.rowPriceSelected]}>₱{Number(price || 0).toFixed(2)}</Text>
  </TouchableOpacity>
);

export default function ItemCustomizationModal({ visible, onClose, item, onConfirm, calculateTotalPrice }) {
  const [addOns, setAddOns] = useState([]);
  const [links, setLinks] = useState([]);
  const [qty, setQty] = useState(1);
  const [selectedRice, setSelectedRice] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [notes, setNotes] = useState('');
  const [size, setSize] = useState('small');

  // Category detection
  const categoryId = item?.categoryId || '';
  const itemName = (item?.name || '').toLowerCase();
  
  // Category flags
  const isMealOrSilog = categoryId === 'silog_meals' || categoryId === 'meal' || categoryId === 'silog';
  const isSnack = categoryId === 'snacks' || categoryId === 'snack';
  const isDrink = categoryId === 'drinks' || categoryId === 'drink' || /lemonade|tea|water|soft|drink/i.test(itemName);
  const isSoftdrink = /soft|cola|coke|sprite|royal|pepsi|fanta|soda/i.test(itemName) && categoryId === 'drinks';
  
  // Allowed add-ons for meal/silog categories (fixed list)
  const allowedMealAddOnNames = [
    'extra plain rice',
    'extra java rice', 
    'extra egg',
    'extra hotdog',
    'extra spam'
  ];

  const drinkSmallPrice = useMemo(() => {
    if (!isDrink) return item?.price || 0;
    if (/\(\s*Large\s*\)/i.test(item?.name || '')) return Math.max(0, (item?.price || 0) - 10);
    return item?.price || 0;
  }, [item, isDrink]);
  const drinkLargePrice = useMemo(() => (isDrink ? drinkSmallPrice + 10 : item?.price || 0), [drinkSmallPrice, isDrink, item]);

  useEffect(() => {
    if (!visible) return;
    const u1 = firestoreService.subscribeCollection('add_ons', { conditions: [['available', '==', true]], order: ['createdAt', 'asc'], next: setAddOns });
    const u2 = firestoreService.subscribeCollection('menu_addons', { conditions: [['menuItemId', '==', item.id]], order: ['sortOrder', 'asc'], next: setLinks });
    return () => { u1 && u1(); u2 && u2(); };
  }, [visible, item?.id]);

  useEffect(() => {
    if (!visible) {
      setQty(1);
      setSelectedRice(null);
      setSelectedDrink(null);
      setSelectedExtras([]);
      setNotes('');
      setSize(/\(\s*Large\s*\)/i.test(item?.name || '') ? 'large' : 'small');
    }
  }, [visible]);

  const allowedAddOnIds = useMemo(() => new Set(links.map((l) => l.addOnId)), [links]);
  
  // Filter add-ons based on category rules
  const grouped = useMemo(() => {
    const rice = [];
    const drink = [];
    const extra = [];
    
    // For softdrinks: disable all customization
    if (isSoftdrink) {
      return { rice: [], drink: [], extra: [] };
    }
    
    // For snacks and drinks: only allow size, no add-ons
    if (isSnack || (isDrink && !isMealOrSilog)) {
      return { rice: [], drink: [], extra: [] };
    }
    
    // For meal/silog: only allow specific add-ons
    addOns.forEach((a) => {
      if (!allowedAddOnIds.has(a.id)) return;
      
      const addOnName = (a.name || '').toLowerCase();
      
      if (isMealOrSilog) {
        // For meal/silog, filter to only allowed add-ons
        const isAllowed = allowedMealAddOnNames.some(allowedName => 
          addOnName.includes(allowedName.toLowerCase().replace('extra ', ''))
        );
        
        if (!isAllowed) return;
        
        // Categorize the allowed add-on
        if (a.category === 'rice') rice.push(a);
        else if (a.category === 'drink') drink.push(a);
        else if (a.category === 'extra') extra.push(a);
      } else {
        // For other categories (if any), use default behavior
        if (a.category === 'rice') rice.push(a);
        else if (a.category === 'drink') drink.push(a);
        else if (a.category === 'extra') extra.push(a);
      }
    });
    
    return { rice, drink, extra };
  }, [addOns, allowedAddOnIds, isMealOrSilog, isSnack, isDrink, isSoftdrink, allowedMealAddOnNames]);

  const selectedAddOns = useMemo(() => {
    return [selectedRice, selectedDrink, ...selectedExtras].filter(Boolean);
  }, [selectedRice, selectedDrink, selectedExtras]);

  // Size pricing for snacks (default to item price for both sizes)
  const snackSmallPrice = item?.price || 0;
  const snackLargePrice = item?.price || 0;

  const basePrice = useMemo(() => {
    if (isSoftdrink) return item?.price || 0;
    if (isSnack) return size === 'large' ? snackLargePrice : snackSmallPrice;
    if (isDrink) return size === 'large' ? drinkLargePrice : drinkSmallPrice;
    return item?.price || 0;
  }, [isDrink, isSnack, isSoftdrink, size, drinkLargePrice, drinkSmallPrice, snackLargePrice, snackSmallPrice, item]);

  const unitPrice = useMemo(() => calculateTotalPrice(basePrice, selectedAddOns), [basePrice, selectedAddOns, calculateTotalPrice]);
  const totalPrice = unitPrice * qty;

  const toggleExtra = (id) => {
    setSelectedExtras((prev) => prev.find((x) => x.id === id) ? prev.filter((x) => x.id !== id) : [...prev, grouped.extra.find((e) => e.id === id)]);
  };

  // Customization options based on category
  const showSizeSelection = (isSnack || (isDrink && !isSoftdrink && !isMealOrSilog)) && !isSoftdrink;
  const showAddOns = isMealOrSilog && !isSoftdrink;
  const showSpecialInstructions = !isSoftdrink;

  const confirm = () => {
    // Validate category rules before confirming
    if (isSoftdrink) {
      // Softdrinks: no customization allowed
      onConfirm({ qty, selectedAddOns: [], specialInstructions: '', totalItemPrice: unitPrice });
      return;
    }
    
    // Include size selection for snacks and drinks (not softdrinks)
    const sizeAddOn = showSizeSelection ? [{ id: `size_${size}`, name: `Size: ${size === 'large' ? 'Large' : 'Small'}`, price: 0 }] : [];
    onConfirm({ qty, selectedAddOns: [...sizeAddOn, ...selectedAddOns], specialInstructions: notes, totalItemPrice: unitPrice });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.name.replace(/\s*\((Small|Large)\)\s*/i, '')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn} activeOpacity={0.7}>
            <Text style={styles.closeHeaderText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Size Selection - Only for snacks and drinks (not softdrinks) */}
          {showSizeSelection && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Size</Text>
              <SelectableRow 
                label="Small" 
                price={isSnack ? snackSmallPrice : drinkSmallPrice} 
                selected={size === 'small'} 
                onPress={() => setSize('small')} 
              />
              <SelectableRow 
                label="Large" 
                price={isSnack ? snackLargePrice : drinkLargePrice} 
                selected={size === 'large'} 
                onPress={() => setSize('large')} 
              />
            </View>
          )}

          {/* Quantity - Always shown */}
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(Math.max(1, qty - 1))}
                activeOpacity={0.7}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(qty + 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add-ons - Only for meal/silog categories */}
          {showAddOns && grouped.rice.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Your Rice</Text>
              {grouped.rice.map((a) => (
                <SelectableRow key={a.id} label={a.name} price={a.price} selected={selectedRice?.id === a.id} onPress={() => setSelectedRice(a)} />
              ))}
            </View>
          )}

          {showAddOns && grouped.drink.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add a Drink</Text>
              {grouped.drink.map((a) => (
                <SelectableRow key={a.id} label={a.name} price={a.price} selected={selectedDrink?.id === a.id} onPress={() => setSelectedDrink(a)} />
              ))}
            </View>
          )}

          {showAddOns && grouped.extra.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Extra Add-ons</Text>
              {grouped.extra.map((a) => (
                <SelectableRow key={a.id} label={a.name} price={a.price} selected={!!selectedExtras.find((x) => x.id === a.id)} onPress={() => toggleExtra(a.id)} />
              ))}
            </View>
          )}

          {/* Special Instructions - Disabled for softdrinks */}
          {showSpecialInstructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Instructions</Text>
              <TextInput
                placeholder="Add notes (e.g., less ice)"
                placeholderTextColor="#9CA3AF"
                value={notes}
                onChangeText={setNotes}
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {/* Info message for softdrinks */}
          {isSoftdrink && (
            <View style={styles.section}>
              <Text style={styles.infoText}>No customization options available for soft drinks.</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.total}>₱{Number(totalPrice).toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={confirm} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    flex: 1,
    letterSpacing: 0.3
  },
  closeHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  closeHeaderText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '900'
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120
  },
  qtySection: {
    marginBottom: 28,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB'
  },
  qtyLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#374151',
    marginBottom: 16,
    letterSpacing: 0.3
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#374151'
  },
  qtyText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    minWidth: 44,
    textAlign: 'center',
    letterSpacing: 0.3
  },
  section: {
    marginBottom: 26
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  rowSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#D1D5DB',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.2
  },
  rowLabelSelected: {
    color: '#1F2937',
    fontWeight: '800'
  },
  rowPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.2
  },
  rowPriceSelected: {
    color: '#3B82F6',
    fontWeight: '900',
    fontSize: 15
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    fontWeight: '500'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB'
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#374151',
    letterSpacing: 0.3
  },
  total: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 0.3
  },
  addBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.5
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB'
  }
});
