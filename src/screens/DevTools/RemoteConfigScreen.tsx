/* eslint-disable no-nested-ternary */
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import * as AC from '@bacons/apple-colors';

import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { Button } from '@app/components/Button/Button';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { parseRemoteConfigValue } from '@app/hooks/firebase/remoteConfigModel';
import {
  defaultRemoteConfig,
  RemoteConfigKey,
  RemoteConfigSchema,
  useRemoteConfig,
} from '@app/hooks/firebase/useRemoteConfig';
import { theme } from '@app/styles/themes';

function getSourceIcon(source: string): SymbolViewProps['name'] {
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

function formatConfigValue(
  raw: string,
  value: RemoteConfigSchema[RemoteConfigKey],
): string {
  return value === raw ? raw : JSON.stringify(value, null, 2);
}

export function RemoteConfigScreen() {
  const { config, refetch, isRefetching } = useRemoteConfig();

  // SAFETY: defaultRemoteConfig is satisfies-checked against Record<RemoteConfigKey, string>
  const configKeys = Object.keys(defaultRemoteConfig) as RemoteConfigKey[];

  const handleRefetch = () => {
    void refetch();
  };

  return (
    <BodyScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Button
          onPress={handleRefetch}
          disabled={isRefetching}
          style={styles.fetchButton}
        >
          {isRefetching ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <SymbolView name='arrow.clockwise' size={16} tintColor='#fff' />
          )}
          <Text type='sm' weight='semibold' style={styles.buttonText}>
            {isRefetching ? 'Fetching...' : 'Fetch from server'}
          </Text>
        </Button>
      </View>

      <View style={styles.section}>
        <Text
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          CONFIG VALUES
        </Text>
        <Text type='xs' color='gray.textLow' style={styles.appVariant}>
          App variant: {process.env.EXPO_PUBLIC_APP_VARIANT}
        </Text>
        <View style={styles.card}>
          {configKeys.map((key, index) => {
            const entry = config[key];
            const defaultRaw = defaultRemoteConfig[key];
            const serverValue = formatConfigValue(entry.raw, entry.value);
            const defaultValue = formatConfigValue(
              defaultRaw,
              parseRemoteConfigValue(key, defaultRaw),
            );
            const isLast = index === configKeys.length - 1;

            return (
              <View
                key={key}
                style={[styles.configItem, !isLast && styles.configItemBorder]}
              >
                <View style={styles.configHeader}>
                  <View style={styles.keyRow}>
                    <SymbolView
                      name={getSourceIcon(entry.source)}
                      size={14}
                      tintColor={
                        entry.source === 'remote'
                          ? AC.systemGreen
                          : AC.systemOrange
                      }
                    />
                    <Text type='sm' weight='semibold'>
                      {key}
                    </Text>
                  </View>
                  <View
                    style={[styles.sourceTag, getSourceTagStyle(entry.source)]}
                  >
                    <Text type='xs' weight='semibold' color='gray.bg'>
                      {entry.source}
                    </Text>
                  </View>
                </View>

                <View style={styles.valuesContainer}>
                  <View style={styles.valueRow}>
                    <Text
                      type='xs'
                      color='gray.textLow'
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
                      type='xs'
                      color='gray.textLow'
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
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          LEGEND
        </Text>
        <View style={styles.card}>
          <View style={[styles.legendItem, styles.configItemBorder]}>
            <SymbolView
              name='cloud.fill'
              size={16}
              tintColor={AC.systemGreen}
            />
            <Text type='sm' color='gray.text'>
              Remote - fetched from Firebase
            </Text>
          </View>
          <View style={styles.legendItem}>
            <SymbolView
              name='arrow.down.circle.fill'
              size={16}
              tintColor={AC.systemOrange}
            />
            <Text type='sm' color='gray.text'>
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
    marginBottom: theme.space12,
  },
  buttonText: {
    color: '#fff',
  },
  card: {
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    overflow: 'hidden',
  },
  configHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configItem: {
    gap: theme.space12,
    padding: theme.space16,
  },
  configItemBorder: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: 1,
  },
  contentContainer: {
    gap: theme.space28,
    padding: theme.space20,
    paddingBottom: 100,
  },
  defaultValueBox: {
    backgroundColor: theme.color.background.darkAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    opacity: 0.7,
    padding: theme.space12,
  },
  defaultValueText: {
    color: theme.color.textSecondary.dark,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  fetchButton: {
    alignItems: 'center',
    backgroundColor: theme.colorBlue,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
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
    padding: theme.space16,
  },
  section: {
    gap: theme.space12,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    marginLeft: theme.space8,
  },
  sourceTag: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  valueBox: {
    backgroundColor: theme.color.background.darkAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    padding: theme.space12,
  },
  valueLabel: {
    marginLeft: 2,
  },
  valueRow: {
    gap: 4,
  },
  valueText: {
    color: theme.colorPrimary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  valuesContainer: {
    gap: theme.space8,
  },
});

function getSourceTagStyle(source: string) {
  return {
    backgroundColor:
      source === 'remote'
        ? theme.colorPrimary
        : source === 'default'
          ? theme.colorOrange
          : theme.color.text.dark,
  };
}
