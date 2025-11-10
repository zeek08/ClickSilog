import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { wp } from '../../utils/responsive';
import Icon from './Icon';
import AnimatedButton from './AnimatedButton';

const ConfirmationModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  icon,
  iconColor
}) => {
  const { theme, spacing, borderRadius, typography } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { padding: spacing.md }]}>
        <View style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
          }
        ]}>
          {icon && (
            <View style={[
              styles.iconContainer,
              {
                backgroundColor: iconColor ? `${iconColor}20` : theme.colors.errorLight,
                borderRadius: borderRadius.round,
                width: wp(64),
                height: wp(64),
                marginBottom: spacing.md,
              }
            ]}>
              <Icon
                name={icon}
                library="ionicons"
                size={wp(32)}
                color={iconColor || theme.colors.error}
              />
            </View>
          )}
          
          <Text style={[
            styles.title,
            {
              color: theme.colors.text,
              ...typography.h3,
              marginBottom: spacing.sm,
            }
          ]}>
            {title}
          </Text>
          
          {message && (
            <Text style={[
              styles.message,
              {
                color: theme.colors.textSecondary,
                ...typography.body,
                marginBottom: spacing.lg,
                textAlign: 'center',
              }
            ]}>
              {message}
            </Text>
          )}

          <View style={[styles.buttonRow, { gap: spacing.md }]}>
            <AnimatedButton
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={onClose}
            >
              <Text 
                style={[
                  styles.buttonText,
                  {
                    color: theme.colors.text,
                    ...typography.bodyBold,
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                allowFontScaling={true}
              >
                {cancelText}
              </Text>
            </AnimatedButton>
            
            <AnimatedButton
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: confirmColor || theme.colors.error,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  flex: 1,
                }
              ]}
              onPress={onConfirm}
            >
              <Text 
                style={[
                  styles.buttonText,
                  {
                    color: '#FFFFFF',
                    ...typography.bodyBold,
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                allowFontScaling={true}
              >
                {confirmText}
              </Text>
            </AnimatedButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    // padding will be set dynamically using theme.spacing
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {},
  confirmButton: {},
  buttonText: {},
});

export default ConfirmationModal;
