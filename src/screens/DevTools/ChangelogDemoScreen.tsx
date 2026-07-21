import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';
import type { ChangelogPresentOptions } from '@modules/changelog/src/Changelog.types';
import ChangelogModule from '@modules/changelog/src/ChangelogModule';

type ChangelogState = {
  currentVersion: string;
  latestSeenAppVersion: string | null;
  latestSeenOTAVersion: string | null;
};

const demoOptions: ChangelogPresentOptions = {
  configuration: {
    accentColorHex: '#1AC9A2',
    doneButtonLabel: 'Done',
    nextButtonLabel: 'Next',
  },
  notes: [
    {
      version: 'demo-native',
      items: [
        {
          type: 'list',
          title: 'Native changelog sheet',
          rows: [
            {
              symbolSystemName: 'sparkles',
              title: 'Typed payload',
              description:
                'The app calls the local module through the exported TypeScript interface.',
            },
            {
              symbolSystemName: 'iphone',
              title: 'SwiftUI presentation',
              description:
                'The native module decodes the payload and presents this sheet from the current view controller.',
            },
          ],
        },
        {
          type: 'media',
          mediaKind: 'image',
          url: 'https://picsum.photos/seed/foam-changelog/900/900',
          title: 'Media page',
          description:
            'Image and video changelog pages use the same discriminated TypeScript item shape.',
        },
      ],
    },
    {
      version: 'demo-ota',
      items: [
        {
          type: 'list',
          title: 'OTA update notes',
          rows: [
            {
              symbolSystemName: 'bolt.fill',
              title: 'OTA marker',
              description:
                'Passing otaVersion marks the OTA seen key instead of the app version key.',
            },
          ],
        },
      ],
    },
  ],
  version: 'demo-native',
};

function readChangelogState(): ChangelogState {
  return {
    currentVersion: ChangelogModule.getCurrentAppVersion(),
    latestSeenAppVersion: ChangelogModule.getLatestSeenAppVersion(),
    latestSeenOTAVersion: ChangelogModule.getLatestSeenOTAVersion(),
  };
}

export function ChangelogDemoScreen() {
  const { t } = useTranslation('devTools');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const [state, setState] = useState<ChangelogState>(() =>
    readChangelogState(),
  );

  const stateRows = [
    [t('currentAppVersion'), state.currentVersion],
    [t('latestSeenAppVersion'), state.latestSeenAppVersion ?? t('none')],
    [t('latestSeenOtaVersion'), state.latestSeenOTAVersion ?? t('none')],
  ];

  const refreshState = () => {
    setState(readChangelogState());
  };

  const handlePresentCurrent = async () => {
    try {
      await ChangelogModule.present(demoOptions);
      refreshState();
    } catch (error) {
      Alert.alert(i18next.t('devTools:changelogFailed'), String(error));
    }
  };

  const handlePresentOTA = async () => {
    try {
      await ChangelogModule.present({
        ...demoOptions,
        otaVersion: 'demo-ota',
        version: undefined,
      });
      refreshState();
    } catch (error) {
      Alert.alert(i18next.t('devTools:changelogFailed'), String(error));
    }
  };

  const handleReset = () => {
    ChangelogModule.resetSeenVersions();
    refreshState();
  };

  const secondaryButtonColors = {
    backgroundColor: theme.color.backgroundAltAlpha[scheme],
    borderColor: theme.color.border[scheme],
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text weight='semibold'>{t('moduleState')}</Text>
          <View
            style={[
              styles.stateCard,
              { backgroundColor: theme.color.backgroundAltAlpha[scheme] },
            ]}
          >
            {stateRows.map(([label, value]) => (
              <View key={label} style={styles.stateRow}>
                <Text type='xs' color='gray.textLow'>
                  {label}
                </Text>
                <Text
                  type='xs'
                  variant='mono'
                  style={{ color: theme.color.accent[scheme] }}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text weight='semibold'>{t('actions')}</Text>
          <View style={styles.actions}>
            <Button
              label={t('presentAppChangelog')}
              onPress={() => void handlePresentCurrent()}
              style={[
                styles.primaryButton,
                { backgroundColor: theme.color.pressedOverlay[scheme] },
              ]}
            >
              <Text
                weight='semibold'
                style={{ color: theme.color.text[scheme] }}
              >
                {t('presentAppChangelog')}
              </Text>
            </Button>
            <Button
              label={t('presentOtaChangelog')}
              onPress={() => void handlePresentOTA()}
              style={[styles.secondaryButton, secondaryButtonColors]}
            >
              <Text weight='semibold'>{t('presentOtaChangelog')}</Text>
            </Button>
            <Button
              label={t('resetSeenVersions')}
              onPress={handleReset}
              style={[styles.secondaryButton, secondaryButtonColors]}
            >
              <Text weight='semibold'>{t('resetSeenVersions')}</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.space12,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.space20,
    paddingBottom: theme.space56,
  },
  primaryButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  secondaryButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  section: {
    gap: theme.space12,
    marginTop: theme.space20,
  },
  stateCard: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    gap: theme.space12,
    padding: theme.space16,
  },
  stateRow: {
    gap: theme.space4,
  },
});
