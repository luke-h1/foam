/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { BodyScrollView } from '@app/components/BodyScrollView';
import { Button } from '@app/components/Button';
import {
  IconSymbol,
  IconSymbolName,
} from '@app/components/IconSymbol/IconSymbol';
import { Text } from '@app/components/Text';
import {
  defaultRemoteConfig,
  RemoteConfigKey,
  useRemoteConfig,
} from '@app/hooks/firebase/useRemoteConfig';
import * as AC from '@bacons/apple-colors';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

function getSourceIcon(source: string): IconSymbolName {
  switch (source) {
    case 'remote':
      return 'cloud.fill' as const;
    case 'default':
      return 'arrow.down.circle.fill' as const;
    case 'static':
      return 'doc.fill' as const;
    default:
      return 'questionmark.circle' as const;
  }
}

function formatValue(value: unknown): string {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function formatDefaultValue(rawValue: string): string {
  try {
    const parsed = JSON.parse(rawValue);
    if (typeof parsed === 'object') {
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    // Not JSON
  }
  return rawValue;
}

export function RemoteConfigScreen() {
  const { config, refetch, isRefetching } = useRemoteConfig();

  const configKeys = Object.keys(defaultRemoteConfig) as RemoteConfigKey[];

  const handleRefetch = () => {
    void refetch();
  };

  return (
    <BodyScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Button
          onPress={handleRefetch}
          disabled={isRefetching}
          style={styles.fetchButton}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
          )}
          <Text type="sm" weight="semibold" style={styles.buttonText}>
            {isRefetching ? 'Fetching...' : 'Fetch from server'}
          </Text>
        </Button>
      </View>

      <View style={styles.section}>
        <Text
          type="xs"
          weight="semibold"
          color="gray.textLow"
          style={styles.sectionTitle}
        >
          CONFIG VALUES
        </Text>
        <Text type="xs" color="gray.textLow" style={styles.appVariant}>
          App variant: {process.env.APP_VARIANT}
        </Text>
        <View style={styles.card}>
          {configKeys.map((key, index) => {
            const entry = config[key];
            const serverValue = formatValue(entry.value);
            const defaultValue = formatDefaultValue(defaultRemoteConfig[key]);
            const isLast = index === configKeys.length - 1;

            return (
              <View
                key={key}
                style={[styles.configItem, !isLast && styles.configItemBorder]}
              >
                <View style={styles.configHeader}>
                  <View style={styles.keyRow}>
                    <IconSymbol
                      name={getSourceIcon(entry.source)}
                      size={14}
                      color={
                        entry.source === 'remote'
                          ? AC.systemGreen
                          : AC.systemOrange
                      }
                    />
                    <Text type="sm" weight="semibold">
                      {key}
                    </Text>
                  </View>
                  <View style={styles.sourceTag(entry.source)}>
                    <Text type="xs" weight="semibold" color="gray.bg">
                      {entry.source}
                    </Text>
                  </View>
                </View>

                <View style={styles.valuesContainer}>
                  <View style={styles.valueRow}>
                    <Text
                      type="xs"
                      color="gray.textLow"
                      style={styles.valueLabel}
                    >
                      Server
                    </Text>
                    <View style={styles.valueBox}>
                      <Text style={styles.valueText}>
                        {serverValue || '(empty)'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.valueRow}>
                    <Text
                      type="xs"
                      color="gray.textLow"
                      style={styles.valueLabel}
                    >
                      Default
                    </Text>
                    <View style={styles.defaultValueBox}>
                      <Text style={styles.defaultValueText}>
                        {defaultValue || '(empty)'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text
          type="xs"
          weight="semibold"
          color="gray.textLow"
          style={styles.sectionTitle}
        >
          LEGEND
        </Text>
        <View style={styles.card}>
          <View style={[styles.legendItem, styles.configItemBorder]}>
            <IconSymbol name="cloud.fill" size={16} color={AC.systemGreen} />
            <Text type="sm" color="gray.text">
              Remote - fetched from Firebase
            </Text>
          </View>
          <View style={styles.legendItem}>
            <IconSymbol
              name="arrow.down.circle.fill"
              size={16}
              color={AC.systemOrange}
            />
            <Text type="sm" color="gray.text">
              Default - using local fallback
            </Text>
          </View>
        </View>
      </View>
    </BodyScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  appVariant: {
    marginBottom: theme.spacing.sm,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    marginLeft: theme.spacing.xs,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: theme.colors.gray.uiAlpha,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.blue.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radii.lg,
  },
  buttonText: {
    color: '#fff',
  },
  configItem: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  configItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.borderAlpha,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sourceTag: (source: string) => ({
    backgroundColor:
      source === 'remote'
        ? theme.colors.green.accent
        : source === 'default'
          ? theme.colors.orange.accent
          : theme.colors.gray.text,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  }),
  valuesContainer: {
    gap: theme.spacing.xs,
  },
  valueRow: {
    gap: 4,
  },
  valueLabel: {
    marginLeft: 2,
  },
  valueBox: {
    backgroundColor: theme.colors.gray.bgAltAlpha,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
  },
  valueText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.grass.accent,
  },
  defaultValueBox: {
    backgroundColor: theme.colors.gray.bgAltAlpha,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    opacity: 0.7,
  },
  defaultValueText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.gray.textLow,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.md,
  },
}));
