import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const RoleSelector = ({ visible, onClose, currentRole, onSelectRole }) => {
  const roles = [
    { id: 'customer', label: 'Customer', color: '#3B82F6' },
    { id: 'kitchen', label: 'Kitchen', color: '#EF4444' },
    { id: 'cashier', label: 'Cashier', color: '#10B981' },
    { id: 'admin', label: 'Admin', color: '#8B5CF6' }
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Role</Text>
          <Text style={styles.subtitle}>Current: {currentRole || 'None'}</Text>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.roleBtn, currentRole === role.id && styles.activeBtn]}
              onPress={() => {
                onSelectRole(role.id);
                onClose();
              }}
            >
              <View style={[styles.colorDot, { backgroundColor: role.color }]} />
              <Text style={[styles.roleText, currentRole === role.id && styles.activeText]}>{role.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', maxWidth: 400 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  roleBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, backgroundColor: '#F3F4F6' },
  activeBtn: { backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#3B82F6' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  roleText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  activeText: { color: '#3B82F6' },
  closeBtn: { marginTop: 8, padding: 12, alignItems: 'center' },
  closeText: { color: '#6B7280', fontWeight: '600' }
});

export default RoleSelector;

