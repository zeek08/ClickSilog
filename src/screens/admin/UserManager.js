import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { firestoreService } from '../../services/firestoreService';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '../../utils/passwordValidation';
import { hashPassword } from '../../utils/passwordHash';
import { widthPercentage } from '../../utils/responsive';
import { useResponsive } from '../../hooks/useResponsive';
import { alertService } from '../../services/alertService';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ThemeToggle from '../../components/ui/ThemeToggle';

const UserManager = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { isTablet } = useResponsive();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'cashier',
    status: 'active',
    displayName: ''
  });
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, user: null });

  const roles = ['admin', 'cashier', 'kitchen', 'developer']; // Keep developer in code for programmatic use
  const selectableRoles = roles.filter(role => role !== 'developer'); // Exclude developer from UI
  const statuses = ['active', 'inactive'];

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeCollection('users', {
      conditions: [],
      order: ['createdAt', 'desc'],
      next: (usersList) => {
        // Deduplicate users by ID to prevent duplicate entries
        const uniqueUsers = usersList.reduce((acc, user) => {
          if (!acc.find(u => u.id === user.id)) {
            acc.push(user);
          }
          return acc;
        }, []);
        setUsers(uniqueUsers);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const openAdd = () => {
    setEditingUser(null);
    setForm({
      username: '',
      password: '',
      role: 'cashier',
      status: 'active',
      displayName: ''
    });
    setPasswordValidation(null);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username || '',
      password: '', // Don't show password
      role: user.role || 'cashier',
      status: user.status || 'active',
      displayName: user.displayName || ''
    });
    setShowModal(true);
  };

  const handlePasswordChange = (password) => {
    setForm(f => ({ ...f, password }));
    if (password) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation(null);
    }
  };

  const save = async () => {
    if (!form.username || !form.displayName) {
      alertService.error('Error', 'Username and display name are required');
      return;
    }

    if (!editingUser && !form.password) {
      alertService.error('Error', 'Password is required for new users');
      return;
    }

    // Validate password if provided
    if (form.password) {
      const validation = validatePassword(form.password);
      if (!validation.isValid) {
        alertService.warning(
          'Weak Password',
          validation.errors.join('\n') + '\n\nPlease use a stronger password.'
        );
        return;
      }
    }

    // Show save confirmation
    setPendingSave({ form, editingUser });
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    setShowSaveConfirm(false);
    const { form: formData, editingUser: user } = pendingSave;
    setPendingSave(null);

    try {
      const form = formData;
      const editingUser = user;
      const now = new Date().toISOString();
      const username = form.username.trim();
      const displayName = form.displayName.trim();

      // Check if username already exists (for new users or if username changed)
      if (!editingUser || username !== editingUser.username) {
        const existingUsers = await firestoreService.getCollectionOnce('users', [
          ['username', '==', username]
        ]);
        if (existingUsers.length > 0 && existingUsers[0].id !== editingUser?.id) {
          alertService.error('Error', 'Username already exists. Please choose a different username.');
          return;
        }
      }

      const userData = {
        username: username,
        role: form.role,
        status: form.status,
        displayName: displayName,
        updatedAt: now
      };

      // Only include password if it's a new user or password was changed
      if (!editingUser || form.password) {
        if (form.password) {
          userData.password = hashPassword(form.password);
        }
      }

      if (editingUser) {
        // Preserve existing fields
        userData.createdAt = editingUser.createdAt || now;
        console.log('Updating user:', editingUser.id, userData);
        // Use upsertDocument with merge to update existing document
        await firestoreService.upsertDocument('users', editingUser.id, userData);
        alertService.success('Success', 'User updated successfully');
      } else {
        userData.createdAt = now;
        const id = `user_${Date.now()}`;
        await firestoreService.upsertDocument('users', id, userData);
        alertService.success('Success', 'User created successfully');
      }

      setShowModal(false);
      setEditingUser(null);
      setForm({ username: '', password: '', role: 'cashier', status: 'active', displayName: '' }); // Reset form
    } catch (error) {
      console.error('Save user error:', error);
      alertService.error('Error', error.message || 'Failed to save user. Please check your connection and try again.');
    }
  };

  const remove = (user) => {
    setDeleteConfirm({ visible: true, user });
  };

  const confirmDelete = async () => {
    const user = deleteConfirm.user;
    setDeleteConfirm({ visible: false, user: null });
    
    try {
      console.log('Deleting user:', user.id);
      await firestoreService.deleteDocument('users', user.id);
      alertService.success('Success', 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      alertService.error('Error', error.message || 'Failed to delete user. Please check your connection and try again.');
    }
  };

  const toggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await firestoreService.updateDocument('users', user.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Toggle status error:', error);
      alertService.error('Error', error.message || 'Failed to update user status. Please check your connection and try again.');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return theme.colors.error;
      case 'cashier': return theme.colors.success;
      case 'kitchen': return theme.colors.warning;
      default: return theme.colors.primary;
    }
  };

  const renderUser = ({ item }) => (
    <View style={[
      styles.userCard,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        opacity: item.status === 'inactive' ? 0.6 : 1
      }
    ]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text, ...typography.bodyBold }]}>
            {item.displayName || item.username}
          </Text>
          <Text style={[styles.userUsername, { color: theme.colors.textSecondary, ...typography.caption }]}>
            @{item.username}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role), ...typography.caption }]}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === 'active' ? theme.colors.successLight : theme.colors.errorLight,
              borderColor: item.status === 'active' ? theme.colors.success : theme.colors.error,
              borderRadius: borderRadius.sm,
              paddingVertical: 3,
              paddingHorizontal: spacing.xs + 2,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }
          ]}>
            <Icon
              name={item.status === 'active' ? 'checkmark-circle' : 'close-circle'}
              library="ionicons"
              size={10}
              color={item.status === 'active' ? theme.colors.success : theme.colors.error}
              responsive={false}
              hitArea={false}
              style={{ marginRight: spacing.xs / 2 }}
            />
            <Text style={[
              styles.statusText,
              {
                color: item.status === 'active' ? theme.colors.success : theme.colors.error,
                fontSize: 11,
                fontWeight: '600',
              }
            ]}>
              {item.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.userActions, { marginTop: spacing.sm, gap: spacing.xs }]}>
        <AnimatedButton
          style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer, borderRadius: borderRadius.sm, padding: spacing.xs, flex: 1 }]}
          onPress={() => openEdit(item)}
        >
          <Text style={[styles.actionText, { color: theme.colors.primary, ...typography.caption }]}>Edit</Text>
        </AnimatedButton>
        <AnimatedButton
          style={[styles.actionButton, { backgroundColor: item.status === 'active' ? theme.colors.success + '20' : theme.colors.warning + '20', borderRadius: borderRadius.sm, padding: spacing.xs, flex: 1 }]}
          onPress={() => toggleStatus(item)}
        >
          <Text style={[styles.actionText, { color: item.status === 'active' ? theme.colors.success : theme.colors.warning, ...typography.caption }]}>
            {item.status === 'active' ? 'Activate' : 'Deactivate'}
          </Text>
        </AnimatedButton>
        <AnimatedButton
          style={[styles.actionButton, { backgroundColor: theme.colors.error + '20', borderRadius: borderRadius.sm, padding: spacing.xs, flex: 1 }]}
          onPress={() => remove(item)}
        >
          <Text style={[styles.actionText, { color: theme.colors.error, ...typography.caption }]}>Delete</Text>
        </AnimatedButton>
      </View>
    </View>
  );

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
              name="people"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[
              styles.headerTitle,
              { color: theme.colors.text, ...typography.h2 }
            ]}>
              User Management
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
          color="#FFFFFF"
          responsive={false}
          hitArea={false}
        />
        <Text style={[
          styles.addButtonText, 
          { 
            color: '#FFFFFF', 
            fontSize: 14,
            fontWeight: '600',
          }
        ]}>
          Add User
        </Text>
      </AnimatedButton>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id || `${item.username}_${item.role}`}
        contentContainerStyle={{ padding: spacing.md }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { padding: spacing.xxl }]}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, ...typography.body }]}>
              No users found
            </Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing.xl }]}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
            }
          ]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, ...typography.h3, marginBottom: spacing.md }]}>
              {editingUser ? 'Edit User' : 'Add User'}
            </Text>

            <KeyboardAwareScrollView
              showsVerticalScrollIndicator={false}
              enableOnAndroid={true}
              extraScrollHeight={80}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ gap: spacing.md }}>
                <View>
                  <Text style={[styles.label, { color: theme.colors.text, ...typography.caption }]}>Display Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text, borderRadius: borderRadius.md, padding: spacing.sm, ...typography.body }]}
                    value={form.displayName}
                    onChangeText={(text) => setForm({ ...form, displayName: text })}
                    placeholder="Enter display name"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <View>
                  <Text style={[styles.label, { color: theme.colors.text, ...typography.caption }]}>Username</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text, borderRadius: borderRadius.md, padding: spacing.sm, ...typography.body }]}
                    value={form.username}
                    onChangeText={(text) => setForm({ ...form, username: text })}
                    placeholder="Enter username"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text style={[styles.label, { color: theme.colors.text, ...typography.caption }]}>
                    Password {editingUser && '(leave blank to keep current)'}
                  </Text>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: theme.colors.background, 
                        borderColor: passwordValidation && !passwordValidation.isValid ? theme.colors.error : theme.colors.border, 
                        color: theme.colors.text, 
                        borderRadius: borderRadius.md, 
                        padding: spacing.sm, 
                        ...typography.body 
                      }
                    ]}
                    value={form.password}
                    onChangeText={handlePasswordChange}
                    placeholder="Enter password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  {passwordValidation && form.password && (
                    <View style={{ marginTop: spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                        <Text style={[
                          { 
                            color: getPasswordStrengthColor(passwordValidation.strength, theme),
                            ...typography.captionBold 
                          }
                        ]}>
                          Password Strength: {getPasswordStrengthText(passwordValidation.strength)}
                        </Text>
                      </View>
                      {passwordValidation.errors.length > 0 && (
                        <View style={{ gap: spacing.xs / 2 }}>
                          {passwordValidation.errors.map((error, idx) => (
                            <Text key={idx} style={[
                              { 
                                color: theme.colors.error,
                                ...typography.caption,
                                fontSize: 12
                              }
                            ]}>
                              • {error}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View>
                  <Text style={[styles.label, { color: theme.colors.text, ...typography.caption }]}>Role</Text>
                  <View style={{ gap: spacing.xs }}>
                    {selectableRoles.map((role) => (
                      <AnimatedButton
                        key={role}
                        style={[
                          styles.roleButton,
                          {
                            backgroundColor: form.role === role ? getRoleColor(role) : theme.colors.background,
                            borderColor: form.role === role ? getRoleColor(role) : theme.colors.border,
                            borderRadius: borderRadius.sm,
                            padding: spacing.sm,
                            borderWidth: 1.5,
                          }
                        ]}
                        onPress={() => setForm({ ...form, role })}
                      >
                        <Text style={[styles.roleButtonText, { color: form.role === role ? '#FFFFFF' : theme.colors.text, ...typography.caption }]}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                      </AnimatedButton>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={[styles.label, { color: theme.colors.text, ...typography.caption }]}>Status</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    {statuses.map((status) => (
                      <AnimatedButton
                        key={status}
                        style={[
                          styles.statusButton,
                          {
                            backgroundColor: form.status === status ? theme.colors.success : theme.colors.background,
                            borderColor: form.status === status ? theme.colors.success : theme.colors.border,
                            borderRadius: borderRadius.sm,
                            padding: spacing.sm,
                            flex: 1,
                            borderWidth: 1,
                          }
                        ]}
                        onPress={() => setForm({ ...form, status })}
                      >
                        <Text style={[styles.statusButtonText, { color: form.status === status ? '#FFFFFF' : theme.colors.text, ...typography.caption }]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </AnimatedButton>
                    ))}
                  </View>
                </View>
              </View>
            </KeyboardAwareScrollView>

            <View style={[styles.modalActions, { marginTop: spacing.md, gap: spacing.sm }]}>
              <AnimatedButton
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderRadius: borderRadius.md, padding: spacing.sm, flex: 1 }]}
                onPress={() => {
                  setShowModal(false);
                  setEditingUser(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text, ...typography.body }]}>Cancel</Text>
              </AnimatedButton>
              <AnimatedButton
                style={[styles.modalButton, { backgroundColor: theme.colors.primary, borderRadius: borderRadius.md, padding: spacing.sm, flex: 1 }]}
                onPress={save}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF', ...typography.bodyBold }]}>Save</Text>
              </AnimatedButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Confirmation Modal */}
      <ConfirmationModal
        visible={showSaveConfirm}
        onClose={() => {
          setShowSaveConfirm(false);
          setPendingSave(null);
        }}
        onConfirm={confirmSave}
        title="Save User"
        message={`Are you sure you want to ${pendingSave?.editingUser ? 'update' : 'create'} this user?`}
        confirmText="Save"
        cancelText="Cancel"
        confirmColor={theme.colors.primary}
        icon="save-outline"
        iconColor={theme.colors.primary}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteConfirm.visible}
        onClose={() => setDeleteConfirm({ visible: false, user: null })}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm.user?.displayName || deleteConfirm.user?.username || 'this user'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor={theme.colors.error}
        icon="trash-outline"
        iconColor={theme.colors.error}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: {},
  addButton: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  addButtonText: {},
  userCard: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: {},
  userUsername: {},
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  roleText: { fontWeight: 'bold' },
  statusBadge: {},
  statusText: { fontWeight: '600' },
  userActions: { flexDirection: 'row' },
  actionButton: {},
  actionText: { textAlign: 'center' },
  emptyContainer: { alignItems: 'center' },
  emptyText: {},
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    width: '100%', 
    maxHeight: '80%', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5 
  },
  modalTitle: {},
  label: { marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, minHeight: 44 },
  roleButton: {},
  roleButtonText: {},
  statusButton: {},
  statusButtonText: { textAlign: 'center' },
  modalActions: { flexDirection: 'row' },
  modalButton: {},
  modalButtonText: { textAlign: 'center' }
});

export default UserManager;

