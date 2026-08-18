import { ScrollView, StyleSheet, View } from 'react-native';
import type { RefObject } from 'react';

import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { openLicenseList } from '@app/lib/legal';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

import { BuildStatus } from './BuildStatus';

function handleSendFeedback() {
  router.push('/feedback');
}

export function SettingsIndexAndroidList({
  bottomInset,
  canSeeUpdateAppButton,
  hasUser,
  openStore,
  scrollRef,
  shouldShowDevTools,
  statusPageUrl,
  updateBundle,
  websiteUrl,
}: {
  bottomInset: number;
  canSeeUpdateAppButton: boolean;
  hasUser: boolean;
  openStore: () => void;
  scrollRef: RefObject<ScrollView | null>;
  shouldShowDevTools: boolean;
  statusPageUrl: string;
  updateBundle: () => void;
  websiteUrl: string;
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + theme.space56 },
        ]}
      >
        <SettingsSection title='Stream Experience'>
          <SettingsLinkRow
            title='Chat'
            subtitle='Density, timestamps, mentions, emotes, and badges'
            icon={{
              icon: 'bubble.left.and.bubble.right',
              color: theme.colorPlum,
            }}
            onPress={() => router.push('/tabs/settings/chat-preferences')}
          />
          <SettingsLinkRow
            title='Blocked Terms'
            subtitle='Hide chat messages containing specific words or phrases'
            icon={{ icon: 'text.badge.xmark', color: theme.colorRed }}
            onPress={() => router.push('/tabs/settings/blocked-terms')}
          />
          <SettingsLinkRow
            title='Emotes & Badges'
            subtitle='Browse global Twitch, BTTV, FFZ, and 7TV emotes and badges'
            icon={{ icon: 'face.smiling', color: theme.colorAmber }}
            onPress={() => router.push('/tabs/settings/emotes-and-badges')}
          />
          <SettingsLinkRow
            title='Saved Phrases'
            subtitle='Save phrases to quickly insert while chatting'
            icon={{ icon: 'text.bubble', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/saved-phrases')}
          />
          <SettingsLinkRow
            title='My Clips'
            subtitle='Clips you have created in foam'
            icon={{ icon: 'scissors', color: theme.colorViolet }}
            onPress={() => router.push('/tabs/settings/my-clips')}
          />
          <SettingsLinkRow
            title='Cache'
            subtitle='Clear local app data, emotes, badges, and media'
            icon={{ icon: 'externaldrive', color: theme.colorPrimary }}
            onPress={() => router.push('/tabs/settings/cache')}
          />
          <SettingsLinkRow
            title='Appearance'
            subtitle='Theme and visual mode'
            icon={{ icon: 'paintpalette', color: theme.colorAmber }}
            onPress={() => router.push('/tabs/settings/appearance')}
          />
        </SettingsSection>

        <SettingsSection title='Account'>
          <SettingsLinkRow
            title={hasUser ? 'Profile' : 'Sign In'}
            subtitle={
              hasUser
                ? 'Channel identity, blocked users, and sign-out controls'
                : 'Connect your Twitch account to unlock following and chat'
            }
            icon={{ icon: 'person.circle', color: theme.colorTeal }}
            onPress={() => {
              if (hasUser) {
                router.push('/tabs/settings/profile');
                return;
              }

              router.push('/auth-sheet');
            }}
          />
        </SettingsSection>

        <SettingsSection title='Support & Feedback'>
          <SettingsLinkRow
            title='About Foam'
            subtitle='What the app is built for and where to reach us'
            icon={{ icon: 'info.circle', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/about')}
          />
          <SettingsLinkRow
            title='FAQ'
            subtitle='Common questions and help information'
            icon={{ icon: 'questionmark.circle', color: theme.colorPrimary }}
            onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
          />
          <SettingsLinkRow
            title='Send Feedback'
            subtitle='Share feedback, ideas, or what could be better'
            icon={{ icon: 'paperplane', color: theme.colorTeal }}
            onPress={handleSendFeedback}
          />
          <SettingsLinkRow
            title='Status'
            subtitle='Check service availability and operational updates'
            icon={{ icon: 'checkmark.shield', color: theme.colorOrange }}
            onPress={() => openLinkInBrowser(statusPageUrl)}
          />
          <SettingsLinkRow
            title='Website'
            subtitle='Product site and public links'
            icon={{ icon: 'globe', color: theme.colorViolet }}
            onPress={() => openLinkInBrowser(websiteUrl)}
          />
          <SettingsLinkRow
            title='OSS Licenses'
            subtitle='Open-source software used by the app'
            icon={{ icon: 'doc.text', color: theme.colorViolet }}
            onPress={() => openLicenseList('OSS Licenses')}
          />
        </SettingsSection>

        <SettingsSection title='App Updates'>
          {canSeeUpdateAppButton ? (
            <SettingsLinkRow
              title='Update App'
              subtitle='Get the latest version from the store'
              icon={{ icon: 'arrow.down.app', color: theme.colorTeal }}
              onPress={openStore}
            />
          ) : null}
          <SettingsLinkRow
            title='Update Bundle'
            subtitle='Download the latest over-the-air update'
            icon={{
              icon: 'arrow.triangle.2.circlepath',
              color: theme.colorBlue,
            }}
            onPress={updateBundle}
          />
        </SettingsSection>

        <SettingsSection title={shouldShowDevTools ? 'Developer' : 'More'}>
          {shouldShowDevTools ? (
            <SettingsLinkRow
              title='Dev Tools'
              subtitle='Diagnostics, cache tools, remote config, and Storybook'
              icon={{ icon: 'hammer', color: theme.colorOrange }}
              onPress={() => router.push('/tabs/settings/dev-tools')}
            />
          ) : null}
          <SettingsLinkRow
            title='Other'
            subtitle='Licenses, changelog, and supporting reference screens'
            icon={{ icon: 'ellipsis.circle', color: theme.colorGrey }}
            onPress={() => router.push('/tabs/settings/other')}
          />
        </SettingsSection>

        <View style={styles.buildWrap}>
          <BuildStatus />
          <Text type='xs' color='gray.textLow' style={styles.buildNote}>
            Build details and release state for this install of Foam.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  buildNote: {
    marginTop: theme.space12,
    paddingHorizontal: theme.space20,
    textAlign: 'center',
  },
  buildWrap: {
    alignItems: 'center',
    marginTop: theme.space12,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
});
