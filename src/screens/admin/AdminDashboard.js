import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

const AdminDashboard = () => {
  const navigation = useNavigation();
  const { theme, spacing, borderRadius, typography } = useTheme();

  const MenuCard = ({ icon, iconColor, title, subtitle, onPress, bgColor, borderColor }) => (
    <AnimatedButton
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1.5,
          flexDirection: 'row',
          alignItems: 'center',
        }
      ]}
      onPress={onPress}
    >
      <View style={[
        styles.cardIcon,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderRadius: borderRadius.lg,
          width: 64,
          height: 64,
          borderWidth: 2.5,
          marginRight: spacing.md,
        }
      ]}>
        <Icon
          name={icon}
          library="ionicons"
          size={32}
          color={iconColor}
        />
          </View>
          <View style={styles.cardContent}>
        <Text style={[
          styles.cardTitle,
          {
            color: theme.colors.text,
            ...typography.h4,
            marginBottom: spacing.xs,
          }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.cardSubtitle,
          {
            color: theme.colors.textSecondary,
            ...typography.caption,
          }
        ]}>
          {subtitle}
        </Text>
          </View>
      <Icon
        name="chevron-forward"
        library="ionicons"
        size={24}
        color={iconColor}
        style={{ marginLeft: spacing.sm }}
      />
    </AnimatedButton>
  );

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
              name="settings"
              library="ionicons"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: spacing.sm }}
            />
            <View>
              <Text style={[
                styles.title,
                {
                  color: theme.colors.text,
                  ...typography.h2,
                  marginBottom: spacing.xs,
                }
              ]}>
                Admin Dashboard
              </Text>
              <Text style={[
                styles.subtitle,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                Manage your restaurant
              </Text>
          </View>
          </View>
          <ThemeToggle />
          </View>
          </View>

      <ScrollView contentContainerStyle={[
        styles.content,
        {
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        }
      ]} showsVerticalScrollIndicator={false}>
        <MenuCard
          icon="restaurant"
          iconColor={theme.colors.primary}
          title="Menu Management"
          subtitle="Add, edit, and manage menu items"
          onPress={() => navigation.navigate('MenuManager')}
          bgColor={theme.colors.primaryContainer}
          borderColor={theme.colors.primary + '40'}
        />

        <MenuCard
          icon="add-circle"
          iconColor={theme.colors.secondary}
          title="Add-on Management"
          subtitle="Manage add-ons (rice, drinks, extras)"
          onPress={() => navigation.navigate('AddOnsManager')}
          bgColor={theme.colors.secondaryLight + '30'}
          borderColor={theme.colors.secondary + '40'}
        />

        <MenuCard
          icon="pricetag"
          iconColor={theme.colors.info}
          title="Discount Management"
          subtitle="Create and manage discount codes"
          onPress={() => navigation.navigate('DiscountManager')}
          bgColor={theme.colors.infoLight + '30'}
          borderColor={theme.colors.info + '40'}
        />

        <MenuCard
          icon="bar-chart"
          iconColor={theme.colors.success}
          title="Sales Report"
          subtitle="View sales analytics and reports"
          onPress={() => navigation.navigate('SalesReport')}
          bgColor={theme.colors.successLight + '30'}
          borderColor={theme.colors.success + '40'}
        />
      </ScrollView>
    </View>
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
