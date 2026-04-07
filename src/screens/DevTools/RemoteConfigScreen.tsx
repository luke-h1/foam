/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { Button } from '@app/components/Button/Button';
import {
  IconSymbol,
  IconSymbolName,
} from '@app/components/IconSymbol/IconSymbol';
import { Text } from '@app/components/Text/Text';
import {
  defaultRemoteConfig,
  RemoteConfigKey,
  useRemoteConfig,
} from '@app/hooks/firebase/useRemoteConfig';
import { theme } from '@app/styles/themes';
import * as AC from '@bacons/apple-colors';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';

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
                  <View
                    style={[styles.sourceTag, getSourceTagStyle(entry.source)]}
                  >
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

const styles = StyleSheet.create({
  appVariant: {
    marginBottom: theme.spacing.sm,
  },
  buttonText: {
    color: '#fff',
  },
  card: {
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  configHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configItem: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  configItemBorder: {
    borderBottomColor: theme.colors.gray.borderAlpha,
    borderBottomWidth: 1,
  },
  contentContainer: {
    gap: theme.spacing.xl,
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  defaultValueBox: {
    backgroundColor: theme.colors.gray.bgAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    opacity: 0.7,
    padding: theme.spacing.sm,
  },
  defaultValueText: {
    color: theme.colors.gray.textLow,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  fetchButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.blue.accent,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  keyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    padding: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    marginLeft: theme.spacing.xs,
  },
  sourceTag: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  valueBox: {
    backgroundColor: theme.colors.gray.bgAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
  },
  valueLabel: {
    marginLeft: 2,
  },
  valueRow: {
    gap: 4,
  },
  valueText: {
    color: theme.colors.grass.accent,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  valuesContainer: {
    gap: theme.spacing.xs,
  },
});

function getSourceTagStyle(source: string) {
  return {
    backgroundColor:
      source === 'remote'
        ? theme.colors.green.accent
        : source === 'default'
          ? theme.colors.orange.accent
          : theme.colors.gray.text,
  };
}
