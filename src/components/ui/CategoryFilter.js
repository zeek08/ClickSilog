import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const CategoryFilter = ({ categories = [], selectedCategory, onSelectCategory }) => {
  const { theme, spacing, borderRadius, typography } = useTheme();

  // Base button style - same for all states - compact and modern
  const baseButtonStyle = {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs + 2, // Compact: 6px
    paddingHorizontal: spacing.sm, // Compact: 12px
    marginRight: spacing.xs,
    borderWidth: 1, // Thinner border
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingHorizontal: spacing.md, 
            paddingVertical: spacing.xs + 2,
            flexGrow: 0, // Prevent stretching
            justifyContent: 'flex-start', // Align to start
            alignItems: 'center', // Center items vertically
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => onSelectCategory(null)}
          style={[
            baseButtonStyle,
            {
              backgroundColor: !selectedCategory ? theme.colors.primary : theme.colors.surface,
              borderColor: !selectedCategory ? theme.colors.primary : theme.colors.border,
              flexShrink: 0, // Prevent button from shrinking
              // Subtle shadow only on active button
              ...(!selectedCategory && {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
                elevation: 1,
              }),
            }
          ]}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.tabText,
              {
              fontSize: 13,
              fontWeight: !selectedCategory ? '600' : '500',
              color: !selectedCategory ? theme.colors.onPrimary || '#FFFFFF' : theme.colors.text,
              textAlign: 'center',
              flexShrink: 0,
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={false}
        >
          {'All'}
        </Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelectCategory(c.id)}
            style={[
              baseButtonStyle,
              {
                backgroundColor: selectedCategory === c.id ? theme.colors.primary : theme.colors.surface,
                borderColor: selectedCategory === c.id ? theme.colors.primary : theme.colors.border,
                flexShrink: 0, // Prevent button from shrinking
                // Subtle shadow only on active button
                ...(selectedCategory === c.id && {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  elevation: 1,
                }),
              }
            ]}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.tabText,
                {
              fontSize: 13,
              fontWeight: selectedCategory === c.id ? '600' : '500',
              color: selectedCategory === c.id ? theme.colors.onPrimary || '#FFFFFF' : theme.colors.text,
              textAlign: 'center',
              flexShrink: 0,
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={false}
        >
          {c.name}
        </Text>
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
    // Base styles moved inline for better control
  },
  tabText: {
    backgroundColor: 'transparent',
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
