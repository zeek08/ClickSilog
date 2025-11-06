import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme } from '../../config/theme';
import Icon from './Icon';
import AnimatedButton from './AnimatedButton';
import errorLogger from '../../utils/errorLogger';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error
    errorLogger.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          fallback={this.props.fallback}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onReset, fallback }) => {
  // Use theme from context if available, otherwise use lightTheme as fallback
  // This prevents errors when ErrorBoundary is outside ThemeProvider
  let theme, spacing, borderRadius, typography;
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    spacing = themeContext.spacing;
    borderRadius = themeContext.borderRadius;
    typography = themeContext.typography;
  } catch (e) {
    // ThemeProvider not available, use fallback theme
    theme = lightTheme;
    spacing = lightTheme.spacing;
    borderRadius = lightTheme.borderRadius;
    typography = lightTheme.typography;
  }

  if (fallback) {
    return fallback({ error, errorInfo, resetError: onReset });
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.background,
        padding: spacing.lg,
      }
    ]}>
      <View style={[
        styles.content,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
        }
      ]}>
        <View style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.errorLight,
            borderRadius: borderRadius.round,
            width: 64,
            height: 64,
            marginBottom: spacing.md,
          }
        ]}>
          <Icon
            name="alert-circle"
            library="ionicons"
            size={32}
            color={theme.colors.error}
          />
        </View>
        <Text style={[
          styles.title,
          {
            color: theme.colors.text,
            ...typography.h2,
            marginBottom: spacing.sm,
            textAlign: 'center',
          }
        ]}>
          Something went wrong
        </Text>
        <Text style={[
          styles.message,
          {
            color: theme.colors.textSecondary,
            ...typography.body,
            marginBottom: spacing.lg,
            textAlign: 'center',
          }
        ]}>
          {error?.message || 'An unexpected error occurred'}
        </Text>
        {__DEV__ && errorInfo && (
          <View style={[
            styles.debugContainer,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            }
          ]}>
            <Text style={[
              styles.debugText,
              {
                color: theme.colors.textTertiary,
                ...typography.caption,
                fontFamily: 'monospace',
              }
            ]}>
              {errorInfo.componentStack}
            </Text>
          </View>
        )}
        <AnimatedButton
          style={[
            styles.resetButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
            }
          ]}
          onPress={onReset}
        >
          <Icon
            name="refresh"
            library="ionicons"
            size={20}
            color={theme.colors.onPrimary}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[
            styles.resetButtonText,
            {
              color: theme.colors.onPrimary,
              ...typography.bodyBold,
            }
          ]}>
            Try Again
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
};

const ErrorBoundary = ({ children, onError, onReset, fallback }) => (
  <ErrorBoundaryClass onError={onError} onReset={onReset} fallback={fallback}>
    {children}
  </ErrorBoundaryClass>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    // Typography handled via theme
  },
  message: {
    // Typography handled via theme
  },
  debugContainer: {
    width: '100%',
    maxHeight: 200,
  },
  debugText: {
    // Typography handled via theme
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    // Typography handled via theme
  },
});

export default ErrorBoundary;

