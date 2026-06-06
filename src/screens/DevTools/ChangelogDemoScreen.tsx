import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import {
  getCurrentAppVersion,
  getLatestSeenAppVersion,
  getLatestSeenOTAVersion,
  presentChangelog,
  resetSeenChangelogVersions,
  type ChangelogPresentOptions,
} from '@modules/changelog';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

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
    currentVersion: getCurrentAppVersion(),
    latestSeenAppVersion: getLatestSeenAppVersion(),
    latestSeenOTAVersion: getLatestSeenOTAVersion(),
  };
}

export function ChangelogDemoScreen() {
  const [state, setState] = useState<ChangelogState>(() =>
    readChangelogState(),
  );

  const stateRows = [
    ['Current app version', state.currentVersion],
    ['Latest seen app version', state.latestSeenAppVersion ?? 'none'],
    ['Latest seen OTA version', state.latestSeenOTAVersion ?? 'none'],
  ];

  const refreshState = () => {
    setState(readChangelogState());
  };

  const handlePresentCurrent = async () => {
    try {
      await presentChangelog(demoOptions);
      refreshState();
    } catch (error) {
      Alert.alert('Changelog failed', String(error));
    }
  };

  const handlePresentOTA = async () => {
    try {
      await presentChangelog({
        ...demoOptions,
        otaVersion: 'demo-ota',
        version: undefined,
      });
      refreshState();
    } catch (error) {
      Alert.alert('Changelog failed', String(error));
    }
  };

  const handleReset = () => {
    resetSeenChangelogVersions();
    refreshState();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text weight='semibold'>Module state</Text>
          <View style={styles.stateCard}>
            {stateRows.map(([label, value]) => (
              <View key={label} style={styles.stateRow}>
                <Text type='xs' color='gray.textLow'>
                  {label}
                </Text>
                <Text type='xs' variant='mono' style={styles.stateValue}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text weight='semibold'>Actions</Text>
          <View style={styles.actions}>
            <Button
              label='Present app changelog'
              onPress={() => void handlePresentCurrent()}
              style={styles.primaryButton}
            >
              <Text weight='semibold' style={styles.primaryButtonText}>
                Present app changelog
              </Text>
            </Button>
            <Button
              label='Present OTA changelog'
              onPress={() => void handlePresentOTA()}
              style={styles.secondaryButton}
            >
              <Text weight='semibold'>Present OTA changelog</Text>
            </Button>
            <Button
              label='Reset seen versions'
              onPress={handleReset}
              style={styles.secondaryButton}
            >
              <Text weight='semibold'>Reset seen versions</Text>
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
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    padding: theme.space20,
    paddingBottom: theme.space56,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  primaryButtonText: {
    color: theme.color.text.dark,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderCurve: 'continuous',
    borderColor: theme.colorBorderSecondary,
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
    backgroundColor: theme.color.background.darkAltAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    gap: theme.space12,
    padding: theme.space16,
  },
  stateRow: {
    gap: theme.space4,
  },
  stateValue: {
    color: theme.colorPrimary,
  },
});
