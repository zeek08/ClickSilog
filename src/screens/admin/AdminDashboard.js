import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import LayoutContainer from '../../components/layout/LayoutContainer';
import ResponsiveText from '../../components/layout/ResponsiveText';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity) => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const AdminDashboard = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography, themeMode } = useTheme();
  const { logout } = React.useContext(AuthContext);
  const { getSpacing, layouts, boundaries } = useResponsiveLayout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };

  const MenuCard = ({ icon, iconColor, title, subtitle, onPress }) => {
    return (
      <AnimatedButton
        style={[
          layouts.row,
          boundaries.fixed,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: borderRadius.xl,
            padding: getSpacing('lg'),
            marginBottom: getSpacing('md'),
            borderWidth: 1,
            borderColor: theme.colors.border,
            minHeight: 80,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }
        ]}
        onPress={onPress}
      >
        <View
          style={{
            marginRight: spacing.md,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: hexToRgba(iconColor, 0.1),
              borderWidth: 1.5,
              borderColor: iconColor + '40',
              padding: spacing.sm,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: iconColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Icon
              name={icon}
              library="ionicons"
              size={28}
              color={iconColor}
              responsive={true}
              hitArea={false}
            />
          </View>
        </View>
        <LayoutContainer
          direction="column"
          align="start"
          justify="center"
          boundary="flexible"
          style={{ flex: 1 }}
        >
          <ResponsiveText
            variant="h4"
            spacing="xs"
            style={{ color: theme.colors.text }}
          >
            {title}
          </ResponsiveText>
          <ResponsiveText
            variant="caption"
            style={{ color: theme.colors.textSecondary }}
          >
            {subtitle}
          </ResponsiveText>
        </LayoutContainer>
        <LayoutContainer
          direction="row"
          align="center"
          justify="center"
          boundary="fixed"
          style={{ marginLeft: getSpacing('sm') }}
        >
          <Icon
            name="chevron-forward"
            library="ionicons"
            size={24}
            color={iconColor}
          />
        </LayoutContainer>
      </AnimatedButton>
    );
  };

  return (
    <LayoutContainer
      direction="column"
      boundary="fullHeight"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 1,
            paddingTop: insets.top + spacing.lg,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }
        ]}
      >
        <View style={[styles.headerContent, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={[styles.titleRow, { flexDirection: 'row', alignItems: 'center', flex: 1 }]}>
            <View style={{ marginRight: spacing.md }}>
              <Icon
                name="settings"
                library="ionicons"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.text,
                    ...typography.h2,
                    fontWeight: 'bold',
                    marginBottom: spacing.xs / 2,
                  }
                ]}
              >
                Admin
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.colors.textSecondary,
                    ...typography.caption,
                  }
                ]}
              >
                Manage restaurant
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: spacing.sm }}>
              <ThemeToggle />
            </View>
            <AnimatedButton
              style={{
                width: 45,
                height: 45,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}
              onPress={handleLogout}
            >
              <View
                style={{
                  width: 45,
                  height: 45,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    backgroundColor: hexToRgba(theme.colors.error, themeMode === 'dark' ? 0.15 : 0.1),
                    borderWidth: 1.5,
                    borderColor: themeMode === 'dark' ? (theme.colors.error + '50') : (theme.colors.error + '40'),
                    padding: spacing.sm,
                    borderRadius: 999,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: theme.colors.error,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: themeMode === 'dark' ? 0.25 : 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Icon
                    name="log-out-outline"
                    library="ionicons"
                    size={22}
                    color={theme.colors.error}
                    responsive={true}
                    hitArea={false}
                  />
                </View>
              </View>
            </AnimatedButton>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: getSpacing('md'),
            paddingBottom: getSpacing('xxl'),
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MenuCard
          icon="restaurant"
          iconColor={theme.colors.primary}
          title="Menu Management"
          subtitle="Add, edit, and manage menu items"
          onPress={() => navigation.navigate('MenuManager')}
        />

        <MenuCard
          icon="add-circle"
          iconColor={theme.colors.secondary}
          title="Add-on Management"
          subtitle="Manage add-ons (rice, drinks, extras)"
          onPress={() => navigation.navigate('AddOnsManager')}
        />

        <MenuCard
          icon="pricetag"
          iconColor={theme.colors.info}
          title="Discount Management"
          subtitle="Create and manage discount codes"
          onPress={() => navigation.navigate('DiscountManager')}
        />

        <MenuCard
          icon="people"
          iconColor={theme.colors.warning}
          title="User Management"
          subtitle="Manage staff accounts and roles"
          onPress={() => navigation.navigate('UserManager')}
        />

        <MenuCard
          icon="bar-chart"
          iconColor={theme.colors.success}
          title="Sales Report"
          subtitle="View sales analytics and reports"
          onPress={() => navigation.navigate('SalesReport')}
        />

        <MenuCard
          icon="cloud-upload"
          iconColor={theme.colors.info}
          title="Seed Database"
          subtitle="Populate Firestore with initial data"
          onPress={() => navigation.navigate('SeedDatabase')}
        />

        <MenuCard
          icon="lock-closed"
          iconColor={theme.colors.primary}
          title="Payment Settings"
          subtitle="Configure payment confirmation password"
          onPress={() => navigation.navigate('PaymentSettings')}
        />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
        icon="log-out-outline"
      />
    </LayoutContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
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
  title: {
    // Typography handled via theme
  },
  subtitle: {
    // Typography handled via theme
  },
  content: {
    // Padding handled inline
  },
  card: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5
  },
  cardIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardContent: {
    flex: 1
  },
  cardTitle: {
    // Typography handled via theme
  },
  cardSubtitle: {
    // Typography handled via theme
  }
});

export default AdminDashboard;
