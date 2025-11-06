import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const CategoryFilter = ({ categories = [], selectedCategory, onSelectCategory }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <TouchableOpacity
          onPress={() => onSelectCategory(null)}
          style={[
            styles.tab,
            {
              backgroundColor: !selectedCategory ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
              borderColor: !selectedCategory ? theme.colors.primary : theme.colors.border,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              marginRight: spacing.sm,
              borderWidth: 1.5,
            }
          ]}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.tabText,
              {
                ...typography.bodyMedium,
                color: !selectedCategory ? theme.colors.primary : theme.colors.text,
              },
              !selectedCategory && styles.tabTextActive
            ]}
            allowFontScaling={false}
          >
            {'All'}
          </Text>
          {!selectedCategory && <View style={[styles.underline, { backgroundColor: theme.colors.primary }]} />}
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelectCategory(c.id)}
            style={[
              styles.tab,
              {
                backgroundColor: selectedCategory === c.id ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                borderColor: selectedCategory === c.id ? theme.colors.primary : theme.colors.border,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                marginRight: spacing.sm,
                borderWidth: 1.5,
              }
            ]}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.tabText,
                {
                  ...typography.bodyMedium,
                  color: selectedCategory === c.id ? theme.colors.primary : theme.colors.text,
                },
                selectedCategory === c.id && styles.tabTextActive
              ]}
              allowFontScaling={false}
            >
              {c.name}
            </Text>
            {selectedCategory === c.id && <View style={[styles.underline, { backgroundColor: theme.colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  scrollContent: {
    // Padding handled inline with theme spacing
  },
  tab: {
    position: 'relative',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  tabText: {
    // Typography handled via theme
    backgroundColor: 'transparent',
  },
  tabTextActive: {
    fontWeight: '700',
    letterSpacing: 0.3
  },
  underline: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  }
});

export default CategoryFilter;
