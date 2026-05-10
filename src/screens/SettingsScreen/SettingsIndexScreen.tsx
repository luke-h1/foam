import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuildStatus } from './components/BuildStatus';

export function SettingsIndexScreen() {
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();
  const { hapticFeedback, update } = usePreferences();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const { statusPageUrl, websiteUrl } = config;

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <View style={styles.iosIntro}>
            <Text type="2xl" weight="bold">
              Settings
            </Text>
            <Text type="sm" color="gray.textLow" style={styles.iosIntroCopy}>
              Streaming controls, account tools, support, and diagnostics.
            </Text>
          </View>

          <Form.Section title="Stream Experience">
            <Form.Link
              systemImage="bubble.left.and.bubble.right"
              onPress={() => router.push('/tabs/settings/chat-preferences')}
            >
              Chat
            </Form.Link>
            <Form.Link
              systemImage="paintpalette"
              onPress={() => router.push('/tabs/settings/appearance')}
            >
              Appearance
            </Form.Link>
            <View style={styles.iosToggleRow}>
              <Form.Text systemImage="iphone">Haptic Feedback</Form.Text>
              <Switch
                value={hapticFeedback}
                onValueChange={value => update({ hapticFeedback: value })}
              />
            </View>
          </Form.Section>

          <Form.Section title="Account">
            <Form.Link
              systemImage="person.circle"
              onPress={() => router.push('/tabs/settings/profile')}
            >
              {user ? 'Profile' : 'Sign In'}
            </Form.Link>
          </Form.Section>

          <Form.Section title="Support & Feedback">
            <Form.Link
              systemImage="info.circle"
              onPress={() => router.push('/tabs/settings/about')}
            >
              About Foam
            </Form.Link>
            <Form.Link
              systemImage="questionmark.circle"
              onPress={() => router.push('/tabs/settings/faq')}
            >
              FAQ
            </Form.Link>
            <Form.Link
              systemImage="checkmark.shield"
              onPress={() => openLinkInBrowser(statusPageUrl.value)}
            >
              Status
            </Form.Link>
            <Form.Link
              systemImage="globe"
              onPress={() => openLinkInBrowser(websiteUrl.value)}
            >
              Website
            </Form.Link>
          </Form.Section>

          <Form.Section title="Developer">
            <Form.Link
              systemImage="hammer"
              onPress={() => router.push('/tabs/settings/dev-tools')}
            >
              Dev Tools
            </Form.Link>
            <Form.Link
              systemImage="ellipsis.circle"
              onPress={() => router.push('/tabs/settings/other')}
            >
              Other
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
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.space56 },
        ]}
      >
        <ScreenHeader
          title="Settings"
          subtitle="Streaming controls, account tools, support, and diagnostics."
          size="medium"
        />

        <SettingsSection title="Stream Experience">
          <SettingsLinkRow
            title="Chat"
            subtitle="Density, timestamps, mentions, emotes, and badges"
            icon={{ icon: 'message-circle', color: theme.colorPlum }}
            onPress={() => router.push('/tabs/settings/chat-preferences')}
          />
          <SettingsLinkRow
            title="Appearance"
            subtitle="Theme, text scale, and interface feedback"
            icon={{ icon: 'sparkles', color: theme.colorAmber }}
            onPress={() => router.push('/tabs/settings/appearance')}
          />
          <SettingsToggleRow
            title="Haptic Feedback"
            subtitle="Subtle physical feedback for interactions"
            icon={{ icon: 'smartphone', color: theme.colorBlue }}
            value={hapticFeedback}
            onValueChange={value => update({ hapticFeedback: value })}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsLinkRow
            title={user ? 'Profile' : 'Sign In'}
            subtitle={
              user
                ? 'Channel identity, blocked users, and sign-out controls'
                : 'Connect your Twitch account to unlock following and chat'
            }
            icon={{ icon: 'user', color: theme.colorTeal }}
            onPress={() => router.push('/tabs/settings/profile')}
          />
        </SettingsSection>

        <SettingsSection title="Support & Feedback">
          <SettingsLinkRow
            title="About Foam"
            subtitle="What the app is built for and where to reach us"
            icon={{ icon: 'info', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/about')}
          />
          <SettingsLinkRow
            title="FAQ"
            subtitle="Common questions and help information"
            icon={{ icon: 'help-circle', color: theme.colorGreen }}
            onPress={() => router.push('/tabs/settings/faq')}
          />
          <SettingsLinkRow
            title="Status"
            subtitle="Check service availability and operational updates"
            icon={{ icon: 'activity', color: theme.colorOrange }}
            onPress={() => openLinkInBrowser(statusPageUrl.value)}
          />
          <SettingsLinkRow
            title="Website"
            subtitle="Product site and public links"
            icon={{ icon: 'globe', color: theme.colorViolet }}
            onPress={() => openLinkInBrowser(websiteUrl.value)}
          />
        </SettingsSection>

        <SettingsSection title="Developer">
          <SettingsLinkRow
            title="Dev Tools"
            subtitle="Diagnostics, cache tools, remote config, and Storybook"
            icon={{ icon: 'tool', color: theme.colorOrange }}
            onPress={() => router.push('/tabs/settings/dev-tools')}
          />
          <SettingsLinkRow
            title="Other"
            subtitle="Licenses, changelog, and supporting reference screens"
            icon={{ icon: 'more-horizontal', color: theme.colorGrey }}
            onPress={() => router.push('/tabs/settings/other')}
          />
        </SettingsSection>

        <View style={styles.buildWrap}>
          <BuildStatus />
          <Text type="xs" color="gray.textLow" style={styles.buildNote}>
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
  iosIntro: {
    gap: theme.space8,
    paddingBottom: theme.space12,
    paddingHorizontal: 20,
  },
  iosIntroCopy: {
    maxWidth: 320,
  },
  iosToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
});
