import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { FOAM_FAQ_URL } from '@app/constants/links';
import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { showFeedbackWidget } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { Button, Form, Host, Section } from '@expo/ui/swift-ui';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuildStatus } from './components/BuildStatus';

function handleSendFeedback() {
  showFeedbackWidget();
}

export function SettingsIndexScreen() {
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const shouldShowDevTools =
    process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
    process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
    process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e';

  useScrollToTop(scrollRef);

  const { statusPageUrl, websiteUrl } = config;

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title='Stream Experience'>
            <Button
              label='Chat'
              systemImage='bubble.left.and.bubble.right'
              onPress={() => router.push('/tabs/settings/chat-preferences')}
            />
            <Button
              label='Cache'
              systemImage='externaldrive'
              onPress={() => router.push('/tabs/settings/cache')}
            />
            <Button
              label='Appearance'
              systemImage='paintpalette'
              onPress={() => router.push('/tabs/settings/appearance')}
            />
          </Section>

          <Section title='Account'>
            <Button
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
            <Button
              label='About Foam'
              systemImage='info.circle'
              onPress={() => router.push('/tabs/settings/about')}
            />
            <Button
              label='FAQ'
              systemImage='questionmark.circle'
              onPress={async () => {
                await openLinkInBrowser(FOAM_FAQ_URL);
              }}
            />
            <Button
              label='Send Feedback'
              systemImage='paperplane'
              onPress={handleSendFeedback}
            />
            <Button
              label='Status'
              systemImage='checkmark.shield'
              onPress={async () => {
                await openLinkInBrowser(statusPageUrl.value);
              }}
            />
            <Button
              label='Website'
              systemImage='globe'
              onPress={async () => {
                await openLinkInBrowser(websiteUrl.value);
              }}
            />
          </Section>

          <Section title={shouldShowDevTools ? 'Developer' : 'More'}>
            {shouldShowDevTools ? (
              <Button
                label='Dev Tools'
                systemImage='hammer'
                onPress={() => router.push('/tabs/settings/dev-tools')}
              />
            ) : null}
            <Button
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
        showsVerticalScrollIndicator={false}
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
            onPress={async () => {
              await openLinkInBrowser(FOAM_FAQ_URL);
            }}
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
            onPress={async () => {
              await openLinkInBrowser(statusPageUrl.value);
            }}
          />
          <SettingsLinkRow
            title='Website'
            subtitle='Product site and public links'
            icon={{ icon: 'globe', color: theme.colorViolet }}
            onPress={async () => {
              await openLinkInBrowser(websiteUrl.value);
            }}
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
