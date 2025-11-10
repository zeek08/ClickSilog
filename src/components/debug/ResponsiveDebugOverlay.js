import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getCachedDimensions, detectDeviceType } from '../../utils/deviceDetection';

/**
 * ResponsiveDebugOverlay - Development tool for debugging responsive layouts
 * Highlights bounding boxes and detects overflows
 */
const ResponsiveDebugOverlay = ({ visible = __DEV__, children }) => {
  const { theme, spacing, typography } = useTheme();
  const { dimensions, deviceType, layoutAdjustments } = useResponsiveLayout();
  const [showInfo, setShowInfo] = useState(false);
  const [overflowWarnings, setOverflowWarnings] = useState([]);

  if (!visible || !__DEV__) {
    return children;
  }

  const cachedDimensions = getCachedDimensions();
  const detectedType = detectDeviceType();

  // Check for overflow warnings
  React.useEffect(() => {
    const warnings = [];
    
    // Check if any dimension exceeds 100%
    if (dimensions.width > 100 || dimensions.height > 100) {
      warnings.push('Screen dimensions exceed 100%');
    }

    // Check aspect ratio
    if (detectedType.aspectRatio > 2.3) {
      warnings.push('Ultra-wide aspect ratio detected (>2.3)');
    }

    setOverflowWarnings(warnings);
  }, [dimensions, detectedType]);

  return (
    <View style={styles.container}>
      {children}
      
      {/* Debug Info Panel */}
      {showInfo && (
        <View style={[styles.debugPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <ScrollView style={styles.scrollView}>
            <Text style={[styles.title, { color: theme.colors.text, ...typography.h4 }]}>
              Responsive Debug Info
            </Text>
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, ...typography.bodyBold }]}>
                Screen Dimensions
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Width: {dimensions.width}px
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Height: {dimensions.height}px
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Aspect Ratio: {detectedType.aspectRatio.toFixed(2)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, ...typography.bodyBold }]}>
                Device Type
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Small: {detectedType.isSmallDevice ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Medium: {detectedType.isMediumDevice ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Large: {detectedType.isLargeDevice ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Ultra-Wide: {detectedType.isUltraWide ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Foldable: {detectedType.isFoldable ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Compact: {detectedType.isCompact ? 'Yes' : 'No'}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, ...typography.bodyBold }]}>
                Layout Adjustments
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Horizontal Padding: {(layoutAdjustments.horizontalPadding * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Vertical Margin: {(layoutAdjustments.verticalMargin * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Font Scale: {(layoutAdjustments.fontScale * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.info, { color: theme.colors.textSecondary, ...typography.caption }]}>
                Button Width: {layoutAdjustments.buttonWidth}
              </Text>
            </View>

            {overflowWarnings.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.error, ...typography.bodyBold }]}>
                  Warnings
                </Text>
                {overflowWarnings.map((warning, index) => (
                  <Text key={index} style={[styles.warning, { color: theme.colors.error, ...typography.caption }]}>
                    ⚠ {warning}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Toggle Button */}
      <TouchableOpacity
        style={[styles.toggleButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowInfo(!showInfo)}
      >
        <Text style={[styles.toggleText, { color: theme.colors.onPrimary }]}>
          {showInfo ? 'Hide' : 'Debug'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugPanel: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 280,
    maxHeight: 500,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  scrollView: {
    maxHeight: 450,
  },
  title: {
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 6,
  },
  info: {
    marginBottom: 4,
  },
  warning: {
    marginBottom: 4,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 9999,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ResponsiveDebugOverlay;

