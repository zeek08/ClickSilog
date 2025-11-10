import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { seedFirestore, migrateMenuCategory } from '../../services/firestoreSeed';
import { appConfig } from '../../config/appConfig';
import { hashPassword } from '../../utils/passwordHash';
import { alertService } from '../../services/alertService';
import Icon from '../../components/ui/Icon';
import AnimatedButton from '../../components/ui/AnimatedButton';

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

const SeedDatabaseScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, spacing, borderRadius, typography } = useTheme();
  const [seeding, setSeeding] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [generatedHash, setGeneratedHash] = useState('');

  const handleSeed = async () => {
    if (appConfig.USE_MOCKS) {
      alertService.warning(
        'Mock Mode Enabled',
        'Cannot seed Firestore when USE_MOCKS is true.\n\nPlease set EXPO_PUBLIC_USE_MOCKS=false in your .env file and restart the app.'
      );
      return;
    }

    alertService.alert(
      'Seed Firestore Database',
      'This will populate your Firestore with initial data:\n\n' +
      '• 4 Users (admin, cashier, kitchen, developer)\n' +
      '• 8 Tables (1-8)\n' +
      '• 3 Menu Categories\n' +
      '• 36 Menu Items\n' +
      '• 5 Add-ons\n\n' +
      'Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
          style: 'destructive',
          onPress: async () => {
            setSeeding(true);
            setResult(null);
            try {
              await seedFirestore();
              setResult({ success: true, message: 'Database seeded successfully!' });
              alertService.success('Success', 'Firestore database has been seeded successfully!');
            } catch (error) {
              setResult({ success: false, message: error.message || 'Failed to seed database' });
              alertService.error('Error', error.message || 'Failed to seed database. Check your Firebase configuration.');
            } finally {
              setSeeding(false);
            }
          }
        }
      ]
    );
  };

  const handleGenerateHash = () => {
    if (!passwordInput.trim()) {
      alertService.warning('Input Required', 'Please enter a password to generate hash.');
      return;
    }
    const hash = hashPassword(passwordInput.trim());
    setGeneratedHash(hash);
    alertService.success('Hash Generated', `Password hash generated!\n\nCopy this hash and paste it into Firestore for the user's password field.`);
  };

  const handleMigrate = async () => {
    if (appConfig.USE_MOCKS) {
      alertService.warning(
        'Mock Mode Enabled',
        'Cannot migrate when USE_MOCKS is true.\n\nPlease set EXPO_PUBLIC_USE_MOCKS=false in your .env file and restart the app.'
      );
      return;
    }

    alertService.alert(
      'Migrate Menu Categories',
      'This will add the "category" field to all existing menu items based on their categoryId or name.\n\n' +
      'Items that already have a category will be skipped.\n\n' +
      'Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          style: 'destructive',
          onPress: async () => {
            setMigrating(true);
            setResult(null);
            try {
              const migrationResult = await migrateMenuCategory();
              setResult({ 
                success: true, 
                message: `Migration completed! Updated: ${migrationResult.updated}, Skipped: ${migrationResult.skipped}` 
              });
              alertService.success(
                'Migration Complete', 
                `Updated ${migrationResult.updated} items, skipped ${migrationResult.skipped} items.`
              );
            } catch (error) {
              setResult({ success: false, message: error.message || 'Failed to migrate menu items' });
              alertService.error('Error', error.message || 'Failed to migrate menu items. Check your Firebase configuration.');
            } finally {
              setMigrating(false);
            }
          }
        }
      ]
    );
  };

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
              style={{
                backgroundColor: 'transparent',
                marginRight: spacing.sm,
              }}
            >
              <View
                style={{
                  backgroundColor: hexToRgba(theme.colors.error, 0.1),
                  borderWidth: 1.5,
                  borderColor: theme.colors.error + '40',
                  padding: spacing.sm,
                  borderRadius: 999,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: theme.colors.error,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Icon
                  name="arrow-back"
                  library="ionicons"
                  size={22}
                  color={theme.colors.error}
                  responsive={true}
                  hitArea={false}
                />
              </View>
            </AnimatedButton>
            <Icon
              name="cloud-upload"
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
                Seed Database
              </Text>
              <Text style={[
                styles.subtitle,
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                }
              ]}>
                Populate Firestore with initial data
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[
        styles.content,
        {
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        }
      ]}>
        <View style={[
          styles.infoCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
          }
        ]}>
          <Icon
            name="information-circle"
            library="ionicons"
            size={24}
            color={theme.colors.info}
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={[
            styles.infoTitle,
            {
              color: theme.colors.text,
              ...typography.h4,
              marginBottom: spacing.sm,
            }
          ]}>
            What gets seeded?
          </Text>
          <Text style={[
            styles.infoText,
            {
              color: theme.colors.textSecondary,
              ...typography.body,
              marginBottom: spacing.xs,
            }
          ]}>
            • 4 Users (admin, cashier, kitchen, developer)
          </Text>
          <Text style={[
            styles.infoText,
            {
              color: theme.colors.textSecondary,
              ...typography.body,
              marginBottom: spacing.xs,
            }
          ]}>
            • 8 Tables (numbers 1-8)
          </Text>
          <Text style={[
            styles.infoText,
            {
              color: theme.colors.textSecondary,
              ...typography.body,
              marginBottom: spacing.xs,
            }
          ]}>
            • 3 Menu Categories (Silog Meals, Snacks, Drinks)
          </Text>
          <Text style={[
            styles.infoText,
            {
              color: theme.colors.textSecondary,
              ...typography.body,
              marginBottom: spacing.xs,
            }
          ]}>
            • 36 Menu Items (15 Silog, 8 Snacks, 13 Drinks)
          </Text>
          <Text style={[
            styles.infoText,
            {
              color: theme.colors.textSecondary,
              ...typography.body,
            }
          ]}>
            • 5 Add-ons (Extra Rice, Extra Egg, etc.)
          </Text>
        </View>

        {appConfig.USE_MOCKS && (
          <View style={[
            styles.warningCard,
            {
              backgroundColor: theme.colors.warningLight + '30',
              borderColor: theme.colors.warning,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderWidth: 1.5,
            }
          ]}>
            <Icon
              name="warning"
              library="ionicons"
              size={24}
              color={theme.colors.warning}
              style={{ marginBottom: spacing.sm }}
            />
            <Text style={[
              styles.warningTitle,
              {
                color: theme.colors.warning,
                ...typography.h4,
                marginBottom: spacing.sm,
              }
            ]}>
              Mock Mode Enabled
            </Text>
            <Text style={[
              styles.warningText,
              {
                color: theme.colors.text,
                ...typography.body,
              }
            ]}>
              Cannot seed Firestore when USE_MOCKS is true.{'\n\n'}
              Set EXPO_PUBLIC_USE_MOCKS=false in your .env file and restart the app.
            </Text>
          </View>
        )}

        {result && (
          <View style={[
            styles.resultCard,
            {
              backgroundColor: result.success 
                ? theme.colors.successLight + '30' 
                : theme.colors.errorLight + '30',
              borderColor: result.success 
                ? theme.colors.success 
                : theme.colors.error,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderWidth: 1.5,
            }
          ]}>
            <Icon
              name={result.success ? 'checkmark-circle' : 'close-circle'}
              library="ionicons"
              size={24}
              color={result.success ? theme.colors.success : theme.colors.error}
              style={{ marginBottom: spacing.sm }}
            />
            <Text style={[
              styles.resultText,
              {
                color: result.success ? theme.colors.success : theme.colors.error,
                ...typography.body,
              }
            ]}>
              {result.message}
            </Text>
          </View>
        )}

        <AnimatedButton
          style={[
            styles.seedButton,
            {
              backgroundColor: appConfig.USE_MOCKS 
                ? theme.colors.surfaceVariant 
                : theme.colors.primary,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.lg,
              shadowColor: theme.colors.primary,
              marginBottom: spacing.md,
            }
          ]}
          onPress={handleSeed}
          disabled={seeding || appConfig.USE_MOCKS}
        >
          {seeding ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <>
              <Icon
                name="cloud-upload"
                library="ionicons"
                size={24}
                color={appConfig.USE_MOCKS ? theme.colors.textSecondary : theme.colors.onPrimary}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.seedButtonText,
                {
                  color: appConfig.USE_MOCKS 
                    ? theme.colors.textSecondary 
                    : theme.colors.onPrimary,
                  ...typography.button,
                }
              ]}>
                Seed Firestore Database
              </Text>
            </>
          )}
        </AnimatedButton>

        <AnimatedButton
          style={[
            styles.seedButton,
            {
              backgroundColor: appConfig.USE_MOCKS 
                ? theme.colors.surfaceVariant 
                : theme.colors.secondary,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.lg,
              shadowColor: theme.colors.secondary,
            }
          ]}
          onPress={handleMigrate}
          disabled={migrating || appConfig.USE_MOCKS}
        >
          {migrating ? (
            <ActivityIndicator color={theme.colors.onSecondary || '#FFFFFF'} />
          ) : (
            <>
              <Icon
                name="sync"
                library="ionicons"
                size={24}
                color={appConfig.USE_MOCKS ? theme.colors.textSecondary : (theme.colors.onSecondary || '#FFFFFF')}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[
                styles.seedButtonText,
                {
                  color: appConfig.USE_MOCKS 
                    ? theme.colors.textSecondary 
                    : (theme.colors.onSecondary || '#FFFFFF'),
                  ...typography.button,
                }
              ]}>
                Migrate Menu Categories
              </Text>
            </>
          )}
        </AnimatedButton>

        {/* Password Hash Generator */}
        <View style={[
          styles.infoCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginTop: spacing.md,
            borderWidth: 1,
          }
        ]}>
          <Icon
            name="key"
            library="ionicons"
            size={24}
            color={theme.colors.primary}
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={[
            styles.infoTitle,
            {
              color: theme.colors.text,
              ...typography.h4,
              marginBottom: spacing.sm,
            }
          ]}>
            Password Hash Generator
          </Text>
          <Text style={[
            styles.infoText,
            {
              color: theme.colors.textSecondary,
              ...typography.caption,
              marginBottom: spacing.md,
            }
          ]}>
            Generate a password hash to manually update user passwords in Firestore.
          </Text>
          
          <TextInput
            style={[
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                padding: spacing.sm,
                marginBottom: spacing.sm,
                ...typography.body,
              }
            ]}
            placeholder="Enter password"
            placeholderTextColor={theme.colors.textSecondary}
            value={passwordInput}
            onChangeText={setPasswordInput}
            secureTextEntry
          />

          <AnimatedButton
            style={[
              {
                backgroundColor: theme.colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.sm,
              }
            ]}
            onPress={handleGenerateHash}
          >
            <Text style={[
              {
                color: theme.colors.onPrimary,
                ...typography.button,
              }
            ]}>
              Generate Hash
            </Text>
          </AnimatedButton>

          {generatedHash && (
            <View style={[
              {
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                marginTop: spacing.sm,
              }
            ]}>
              <Text style={[
                {
                  color: theme.colors.primary,
                  ...typography.caption,
                  marginBottom: spacing.xs,
                }
              ]}>
                Generated Hash:
              </Text>
              <Text
                style={[
                  {
                    color: theme.colors.text,
                    ...typography.body,
                    fontFamily: 'monospace',
                  }
                ]}
                selectable
              >
                {generatedHash}
              </Text>
              <Text style={[
                {
                  color: theme.colors.textSecondary,
                  ...typography.caption,
                  marginTop: spacing.xs,
                  fontSize: 11,
                }
              ]}>
                Copy this hash and paste it into Firestore for the user's password field.
              </Text>
            </View>
          )}
        </View>
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
    fontWeight: 'bold'
  },
  subtitle: {
    // Typography handled via theme
  },
  content: {
    // Padding handled inline
  },
  infoCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  infoTitle: {
    fontWeight: 'bold'
  },
  infoText: {
    // Typography handled via theme
  },
  warningCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  warningTitle: {
    fontWeight: 'bold'
  },
  warningText: {
    // Typography handled via theme
  },
  resultCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  resultText: {
    // Typography handled via theme
  },
  seedButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5
  },
  seedButtonText: {
    fontWeight: 'bold'
  }
});

export default SeedDatabaseScreen;

