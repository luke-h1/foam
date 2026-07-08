import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import * as AC from '@bacons/apple-colors';
import * as Clipboard from 'expo-clipboard';

import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { impact, selection } from '@app/lib/haptics';
import { theme } from '@app/styles/themes';

type EnvVar = {
  key: string;
  value: string | undefined;
  /**
   * Secrets (API keys, tokens, DSNs) are masked until the reveal toggle is on
   * so the values are not exposed on a screen-share or screenshot by default.
   */
  secret?: boolean;
};

/**
 * Only variables statically referenced as `process.env.EXPO_PUBLIC_*` are
 * inlined into the JS bundle at build time, so this list is written out
 * explicitly rather than enumerated - `process.env` is not a real object at
 * runtime and cannot be iterated. Non-`EXPO_PUBLIC_` entries in `.env`
 * (AWS keys, GitHub tokens) never reach the app and would read `undefined`.
 */
function getEnvVars(): EnvVar[] {
  return [
    {
      key: 'EXPO_PUBLIC_APP_VARIANT',
      value: process.env.EXPO_PUBLIC_APP_VARIANT,
    },
    {
      key: 'EXPO_PUBLIC_TWITCH_CLIENT_ID',
      value: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      secret: true,
    },
    {
      key: 'EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL',
      value: process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL,
    },
    {
      key: 'EXPO_PUBLIC_AUTH_PROXY_API_KEY',
      value: process.env.EXPO_PUBLIC_AUTH_PROXY_API_KEY,
      secret: true,
    },
    {
      key: 'EXPO_PUBLIC_ENABLE_SENTRY',
      value: process.env.EXPO_PUBLIC_ENABLE_SENTRY,
    },
    {
      key: 'EXPO_PUBLIC_SENTRY_DSN',
      value: process.env.EXPO_PUBLIC_SENTRY_DSN,
      secret: true,
    },
    {
      key: 'EXPO_PUBLIC_SENTRY_RELEASE',
      value: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    },
    {
      key: 'EXPO_PUBLIC_SENTRY_DIST',
      value: process.env.EXPO_PUBLIC_SENTRY_DIST,
    },
    {
      key: 'EXPO_PUBLIC_SENTRY_DEBUG',
      value: process.env.EXPO_PUBLIC_SENTRY_DEBUG,
    },
    {
      key: 'EXPO_PUBLIC_STATSIG_CLIENT_KEY',
      value: process.env.EXPO_PUBLIC_STATSIG_CLIENT_KEY,
      secret: true,
    },
    {
      key: 'EXPO_PUBLIC_ENABLE_WDYR',
      value: process.env.EXPO_PUBLIC_ENABLE_WDYR,
    },
    {
      key: 'EXPO_PUBLIC_WITH_STORYBOOK',
      value: process.env.EXPO_PUBLIC_WITH_STORYBOOK,
    },
    {
      key: 'EXPO_PUBLIC_WITH_ROZENITE',
      value: process.env.EXPO_PUBLIC_WITH_ROZENITE,
    },
    { key: 'NODE_ENV', value: process.env.NODE_ENV },
    { key: 'EXPO_OS', value: process.env.EXPO_OS },
  ];
}

async function copyEnvVar(entry: EnvVar): Promise<void> {
  if (entry.value == null) {
    return;
  }
  await Clipboard.setStringAsync(String(entry.value));
  void impact('light');
}

function maskValue(value: string): string {
  if (value.length <= 6) {
    return '•'.repeat(value.length);
  }
  return `${value.slice(0, 4)}${'•'.repeat(value.length - 6)}${value.slice(-2)}`;
}

export function EnvVarsScreen() {
  const [revealed, setRevealed] = useState(false);
  const envVars = useMemo(() => getEnvVars(), []);

  const setCount = envVars.filter(
    v => v.value != null && v.value !== '',
  ).length;

  const toggleReveal = () => {
    void selection();
    setRevealed(prev => !prev);
  };

  return (
    <BodyScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Button onPress={toggleReveal} style={styles.revealButton}>
          <SymbolView
            name={revealed ? 'eye.slash' : 'eye'}
            size={16}
            tintColor='#fff'
          />
          <Text type='sm' weight='semibold' style={styles.buttonText}>
            {revealed
              ? i18next.t('devTools:hideSecrets')
              : i18next.t('devTools:revealSecrets')}
          </Text>
        </Button>
        <Text type='xs' color='gray.textLow' style={styles.note}>
          {i18next.t('devTools:envVarsNote')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          {i18next
            .t('devTools:envVarsCount', {
              set: setCount,
              total: envVars.length,
            })
            .toUpperCase()}
        </Text>
        <View style={styles.card}>
          {envVars.map((entry, index) => {
            const isLast = index === envVars.length - 1;
            const isSet = entry.value != null && entry.value !== '';
            const raw = entry.value == null ? '' : String(entry.value);
            const display = !isSet
              ? i18next.t('devTools:envVarUndefined')
              : entry.secret && !revealed
                ? maskValue(raw)
                : raw;

            return (
              <Pressable
                key={entry.key}
                onPress={() => {
                  void copyEnvVar(entry);
                }}
                disabled={!isSet}
                style={[styles.item, !isLast && styles.itemBorder]}
              >
                <View style={styles.keyRow}>
                  <SymbolView
                    name={isSet ? 'checkmark.circle.fill' : 'circle.dashed'}
                    size={14}
                    tintColor={isSet ? AC.systemGreen : AC.systemGray}
                  />
                  <Text type='sm' weight='semibold' style={styles.keyText}>
                    {entry.key}
                  </Text>
                  {entry.secret ? (
                    <SymbolView
                      name='lock.fill'
                      size={11}
                      tintColor={AC.systemOrange}
                    />
                  ) : null}
                </View>
                <View style={[styles.valueBox, !isSet && styles.valueBoxEmpty]}>
                  <Text
                    style={[styles.valueText, !isSet && styles.valueTextEmpty]}
                  >
                    {display}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </BodyScrollView>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    color: '#fff',
  },
  card: {
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    overflow: 'hidden',
  },
  contentContainer: {
    gap: theme.space28,
    padding: theme.space20,
    paddingBottom: 100,
  },
  item: {
    gap: theme.space8,
    padding: theme.space16,
  },
  itemBorder: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: 1,
  },
  keyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  keyText: {
    flexShrink: 1,
  },
  note: {
    marginLeft: theme.space8,
  },
  revealButton: {
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
  section: {
    gap: theme.space12,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    marginLeft: theme.space8,
  },
  valueBox: {
    backgroundColor: theme.color.background.darkAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    padding: theme.space12,
  },
  valueBoxEmpty: {
    opacity: 0.6,
  },
  valueText: {
    color: theme.colorPrimary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  valueTextEmpty: {
    color: theme.color.textSecondary.dark,
    fontStyle: 'italic',
  },
});
