import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { showFeedbackWidget } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
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
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <ScreenHeader
            title='Settings'
            subtitle='Streaming controls'
            size='medium'
          />

          <Form.Section title='Stream Experience'>
            <Form.Link
              systemImage='bubble.left.and.bubble.right'
              onPress={() => router.push('/tabs/settings/chat-preferences')}
            >
              <Form.Text>Chat</Form.Text>
            </Form.Link>
            <Form.Link
              systemImage='externaldrive'
              onPress={() => router.push('/tabs/settings/cache')}
            >
              <Form.Text>Cache</Form.Text>
            </Form.Link>
            <Form.Link
              systemImage='paintpalette'
              onPress={() => router.push('/tabs/settings/appearance')}
            >
              <Form.Text>Appearance</Form.Text>
            </Form.Link>
          </Form.Section>

          <Form.Section title='Account'>
            <Form.Link
              systemImage='person.circle'
              onPress={() => {
                if (user) {
                  router.push('/tabs/settings/profile');
                  return;
                }

                router.push('/auth-sheet');
              }}
            >
              <Form.Text>{user ? 'Profile' : 'Sign In'}</Form.Text>
            </Form.Link>
          </Form.Section>

          <Form.Section title='Support & Feedback'>
            <Form.Link
              systemImage='info.circle'
              onPress={() => router.push('/tabs/settings/about')}
            >
              <Form.Text>About Foam</Form.Text>
            </Form.Link>
            <Form.Link
              systemImage='questionmark.circle'
              onPress={() => router.push('/tabs/settings/faq')}
            >
              <Form.Text>FAQ</Form.Text>
            </Form.Link>
            <Form.Link systemImage='paperplane' onPress={handleSendFeedback}>
              <Form.Text>Send Feedback</Form.Text>
            </Form.Link>
            <Form.Link
              systemImage='checkmark.shield'
              onPress={() => openLinkInBrowser(statusPageUrl.value)}
            >
              <Form.Text>Status</Form.Text>
            </Form.Link>
            <Form.Link
              systemImage='globe'
              onPress={() => openLinkInBrowser(websiteUrl.value)}
            >
              <Form.Text>Website</Form.Text>
            </Form.Link>
          </Form.Section>

          <Form.Section title={shouldShowDevTools ? 'Developer' : 'More'}>
            {shouldShowDevTools ? (
              <Form.Link
                systemImage='hammer'
                onPress={() => router.push('/tabs/settings/dev-tools')}
              >
                <Form.Text>Dev Tools</Form.Text>
              </Form.Link>
            ) : null}
            <Form.Link
              systemImage='ellipsis.circle'
              onPress={() => router.push('/tabs/settings/other')}
            >
              <Form.Text>Other</Form.Text>
            </Form.Link>
          </Form.Section>
        </BodyScrollView>
      </View>
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
        <ScreenHeader
          title='Settings'
          subtitle='Streaming controls, account tools, support, and diagnostics.'
          size='medium'
        />

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
            icon={{ icon: 'externaldrive', color: theme.colorGreen }}
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
            icon={{ icon: 'questionmark.circle', color: theme.colorGreen }}
            onPress={() => router.push('/tabs/settings/faq')}
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
  iosContent: {
    paddingBottom: theme.space56,
    paddingTop: theme.space12,
  },
});
