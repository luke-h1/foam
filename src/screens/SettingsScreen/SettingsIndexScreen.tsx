import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Form, Host, Section, Text as UIText } from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { useAppUpdate } from '@app/hooks/useAppUpdate';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { openLicenseList } from '@app/lib/legal';
import { theme } from '@app/styles/themes';
import { isUpdateAppButtonAllowed } from '@app/utils/appUpdate/isUpdateAppButtonAllowed';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import {
  isAdminLogin,
  isDevToolsEnabled,
} from '@app/utils/devTools/devToolsGate';
import { getBuildInfoLabel } from '@app/utils/version/buildInfoLabel';

import { BuildStatus } from './components/BuildStatus';
import { FormNavigationRow } from './components/FormNavigationRow';

function handleSendFeedback() {
  router.push('/feedback');
}

const variant = process.env.EXPO_PUBLIC_APP_VARIANT;

export function SettingsIndexScreen() {
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { openStore, updateBundle } = useAppUpdate();
  const shouldShowDevTools =
    isDevToolsEnabled || isAdminLogin(user?.login, config.admins.value);

  useScrollToTop(scrollRef);

  const {
    statusPageUrl,
    websiteUrl,
    bundleButtonEnabled: configBundleButtonEnabled,
  } = config;

  const bundleButtonEnabled = configBundleButtonEnabled.value.ios[variant];
  const canSeeUpdateAppButton = isUpdateAppButtonAllowed(
    user?.login,
    config.updateAppButtonAllowedUsers.value,
  );

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title='Stream Experience'>
            <FormNavigationRow
              label='Chat'
              systemImage='bubble.left.and.bubble.right'
              onPress={() => router.push('/tabs/settings/chat-preferences')}
            />
            <FormNavigationRow
              label='Blocked Terms'
              systemImage='text.badge.xmark'
              onPress={() => router.push('/tabs/settings/blocked-terms')}
            />
            <FormNavigationRow
              label='Emotes & Badges'
              systemImage='face.smiling'
              onPress={() => router.push('/tabs/settings/emotes-and-badges')}
            />
            <FormNavigationRow
              label='Saved Phrases'
              systemImage='text.bubble'
              onPress={() => router.push('/tabs/settings/saved-phrases')}
            />
            <FormNavigationRow
              label='My Clips'
              systemImage='scissors'
              onPress={() => router.push('/tabs/settings/my-clips')}
            />
            <FormNavigationRow
              label='Cache'
              systemImage='externaldrive'
              onPress={() => router.push('/tabs/settings/cache')}
            />
            <FormNavigationRow
              label='Appearance'
              systemImage='paintpalette'
              onPress={() => router.push('/tabs/settings/appearance')}
            />
          </Section>

          <Section title='Account'>
            <FormNavigationRow
              label={user ? 'Profile' : 'Sign In'}
              systemImage='person.circle'
              onPress={() => {
                if (user) {
                  router.push('/tabs/settings/profile');
                  return;
                }

                router.push('/auth-sheet');
              }}
            />
          </Section>

          <Section title='Support & Feedback'>
            <FormNavigationRow
              label='About Foam'
              systemImage='info.circle'
              onPress={() => router.push('/tabs/settings/about')}
            />
            <Button
              label='FAQ'
              systemImage='questionmark.circle'
              onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
            />
            <Button
              label='Send Feedback'
              systemImage='paperplane'
              onPress={handleSendFeedback}
            />
            <Button
              label='Status'
              systemImage='checkmark.shield'
              onPress={() => openLinkInBrowser(statusPageUrl.value)}
            />
            <Button
              label='Website'
              systemImage='globe'
              onPress={() => openLinkInBrowser(websiteUrl.value)}
            />
            <Button
              label='OSS Licenses'
              systemImage='doc.text'
              onPress={() => openLicenseList('OSS Licenses')}
            />
          </Section>

          {canSeeUpdateAppButton || bundleButtonEnabled ? (
            <Section title='App Updates'>
              {canSeeUpdateAppButton ? (
                <Button
                  label='Update App'
                  systemImage='arrow.down.app'
                  onPress={openStore}
                />
              ) : null}
              {bundleButtonEnabled ? (
                <Button
                  label='Update Bundle'
                  systemImage='arrow.triangle.2.circlepath'
                  onPress={updateBundle}
                />
              ) : null}
            </Section>
          ) : null}

          <Section
            title={shouldShowDevTools ? 'Developer' : 'More'}
            footer={<UIText>{getBuildInfoLabel()}</UIText>}
          >
            {shouldShowDevTools ? (
              <FormNavigationRow
                label='Dev Tools'
                systemImage='hammer'
                onPress={() => router.push('/tabs/settings/dev-tools')}
              />
            ) : null}
            <FormNavigationRow
              label='Other'
              systemImage='ellipsis.circle'
              onPress={() => router.push('/tabs/settings/other')}
            />
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.space56 },
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
            title={user ? 'Profile' : 'Sign In'}
            subtitle={
              user
                ? 'Channel identity, blocked users, and sign-out controls'
                : 'Connect your Twitch account to unlock following and chat'
            }
            icon={{ icon: 'person.circle', color: theme.colorTeal }}
            onPress={() => {
              if (user) {
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
            onPress={() => openLinkInBrowser(statusPageUrl.value)}
          />
          <SettingsLinkRow
            title='Website'
            subtitle='Product site and public links'
            icon={{ icon: 'globe', color: theme.colorViolet }}
            onPress={() => openLinkInBrowser(websiteUrl.value)}
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
  iosHost: {
    flex: 1,
  },
});
