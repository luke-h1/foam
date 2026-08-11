import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Form,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

import { FormNavigationRow } from './components/FormNavigationRow';

export function SettingsDevtoolsScreen() {
  const {
    disableChat,
    disableStream,
    sharedChatEnabled,
    enhancedVideoStability,
    chatDebugTools,
    update,
  } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title='Diagnostics'>
            <FormNavigationRow
              label='App Diagnostics'
              systemImage='stethoscope'
              onPress={() => router.push('/tabs/settings/diagnostics')}
            />
            <FormNavigationRow
              label='Remote Config'
              systemImage='cloud'
              onPress={() => router.push('/tabs/settings/remote-config')}
            />
          </Section>

          <Section title='Stream Diagnostics'>
            <Toggle
              isOn={disableStream}
              onIsOnChange={value => update({ disableStream: value })}
            >
              <NativeText>Disable Stream</NativeText>
              <NativeText>
                Remove the Twitch WebView to isolate chat performance
              </NativeText>
            </Toggle>
            <Toggle
              isOn={disableChat}
              onIsOnChange={value => update({ disableChat: value })}
            >
              <NativeText>Disable Chat</NativeText>
              <NativeText>
                Remove chat rendering to isolate the player
              </NativeText>
            </Toggle>
          </Section>

          <Section title='Feature Flags'>
            <Toggle
              isOn={sharedChatEnabled}
              onIsOnChange={value => update({ sharedChatEnabled: value })}
            >
              <NativeText>Shared Chat</NativeText>
              <NativeText>
                Show the source label and badge on messages relayed from another
                channel in a shared chat session
              </NativeText>
            </Toggle>
            <Toggle
              isOn={enhancedVideoStability}
              onIsOnChange={value => update({ enhancedVideoStability: value })}
            >
              <NativeText>Enhanced Video Stability</NativeText>
              <NativeText>
                Automatically refresh the player to recover from silent stalls,
                video errors, and high latency
              </NativeText>
            </Toggle>
            {isDevToolsEnabled ? (
              <Toggle
                isOn={chatDebugTools}
                onIsOnChange={value => update({ chatDebugTools: value })}
              >
                <NativeText>Chat Debug Tools</NativeText>
                <NativeText>
                  Capture raw IRC lines and show debug details in the chat user,
                  emote, and badge sheets
                </NativeText>
              </Toggle>
            ) : null}
          </Section>

          <Section title='Developer Tools'>
            <FormNavigationRow
              label='Debug'
              systemImage='ladybug'
              onPress={() => router.push('/tabs/settings/debug')}
            />
            <FormNavigationRow
              label='Cached Images'
              systemImage='photo.stack'
              onPress={() => router.push('/tabs/settings/cached-images')}
            />
            <FormNavigationRow
              label='Changelog Demo'
              systemImage='list.bullet.rectangle'
              onPress={() => router.push('/dev-tools/changelog')}
            />
            <FormNavigationRow
              label='Sentry Test'
              systemImage='exclamationmark.triangle'
              onPress={() => router.push('/dev-tools/sentry-demo')}
            />
            <FormNavigationRow
              label='Image Benchmark'
              systemImage='speedometer'
              onPress={() => router.push('/dev-tools/image-benchmark')}
            />
            <FormNavigationRow
              label='Chat Perf (burst test)'
              systemImage='bolt.horizontal'
              onPress={() => router.push('/dev-tools/chat-perf')}
            />
            <FormNavigationRow
              label='Environment Variables'
              systemImage='doc.text'
              onPress={() => router.push('/dev-tools/env-vars')}
            />
            <FormNavigationRow
              label='Synced Emotes'
              systemImage='metronome'
              onPress={() => router.push('/dev-tools/synced-emotes')}
            />
            <FormNavigationRow
              label='Channel Surfing'
              systemImage='antenna.radiowaves.left.and.right'
              onPress={() => router.push('/tabs/settings/channel-surfing')}
            />
            <FormNavigationRow
              label='Storybook'
              systemImage='book.closed'
              onPress={() => router.push('/tabs/settings/storybook')}
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
        contentContainerStyle={styles.content}
      >
        <SettingsSection title='Diagnostics'>
          <SettingsLinkRow
            title='App Diagnostics'
            subtitle='Version, environment, and runtime details'
            icon={{ icon: 'stethoscope', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/diagnostics')}
          />
          <SettingsLinkRow
            title='Remote Config'
            subtitle='Inspect fetched config and local overrides'
            icon={{ icon: 'cloud', color: theme.colorPlum }}
            onPress={() => router.push('/tabs/settings/remote-config')}
          />
        </SettingsSection>

        <SettingsSection title='Stream Diagnostics'>
          <SettingsToggleRow
            title='Disable Stream'
            subtitle='Remove the Twitch WebView to isolate chat performance'
            icon={{ icon: 'video.slash', color: theme.colorOrange }}
            value={disableStream}
            onValueChange={value => update({ disableStream: value })}
          />
          <SettingsToggleRow
            title='Disable Chat'
            subtitle='Remove chat rendering to isolate the player'
            icon={{ icon: 'message', color: theme.colorPlum }}
            value={disableChat}
            onValueChange={value => update({ disableChat: value })}
          />
        </SettingsSection>

        <SettingsSection title='Feature Flags'>
          <SettingsToggleRow
            title='Shared Chat'
            subtitle='Show the source label and badge on messages relayed from another channel in a shared chat session'
            icon={{
              icon: 'bubble.left.and.bubble.right',
              color: theme.colorTeal,
            }}
            value={sharedChatEnabled}
            onValueChange={value => update({ sharedChatEnabled: value })}
          />
          <SettingsToggleRow
            title='Enhanced Video Stability'
            subtitle='Automatically refresh the player to recover from silent stalls, video errors, and high latency'
            icon={{ icon: 'wand.and.stars', color: theme.colorBlue }}
            value={enhancedVideoStability}
            onValueChange={value => update({ enhancedVideoStability: value })}
          />
          {isDevToolsEnabled ? (
            <SettingsToggleRow
              title='Chat Debug Tools'
              subtitle='Capture raw IRC lines and show debug details in the chat user, emote, and badge sheets'
              icon={{ icon: 'ladybug', color: theme.colorTeal }}
              value={chatDebugTools}
              onValueChange={value => update({ chatDebugTools: value })}
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title='Developer Tools'>
          <SettingsLinkRow
            title='Debug'
            subtitle='Manual debug helpers and experiments'
            icon={{ icon: 'ladybug', color: theme.colorOrange }}
            onPress={() => router.push('/tabs/settings/debug')}
          />
          <SettingsLinkRow
            title='Cached Images'
            subtitle='Inspect and manage emote and badge media cache'
            icon={{ icon: 'photo.stack', color: theme.colorPrimary }}
            onPress={() => router.push('/tabs/settings/cached-images')}
          />
          <SettingsLinkRow
            title='Changelog Demo'
            subtitle='Present sample native changelog payloads'
            icon={{ icon: 'list.bullet.rectangle', color: theme.colorBlue }}
            onPress={() => router.push('/dev-tools/changelog')}
          />
          <SettingsLinkRow
            title='Sentry Test'
            subtitle='Throw an error to verify Sentry capture'
            icon={{
              icon: 'exclamationmark.triangle',
              color: theme.colorRed,
            }}
            onPress={() => router.push('/dev-tools/sentry-demo')}
          />
          <SettingsLinkRow
            title='Image Benchmark'
            subtitle='expo-image vs nitro decode + synthetic chat stress test'
            icon={{ icon: 'speedometer', color: theme.colorTeal }}
            onPress={() => router.push('/dev-tools/image-benchmark')}
          />
          <SettingsLinkRow
            title='Chat Perf (burst test)'
            subtitle='real cinna chat + synthetic burst flood + live FPS readout'
            icon={{ icon: 'bolt.horizontal', color: theme.colorOrange }}
            onPress={() => router.push('/dev-tools/chat-perf')}
          />
          <SettingsLinkRow
            title='Environment Variables'
            subtitle='Inspect the EXPO_PUBLIC_ vars baked into this build'
            icon={{ icon: 'doc.text', color: theme.colorTeal }}
            onPress={() => router.push('/dev-tools/env-vars')}
          />
          <SettingsLinkRow
            title='Synced Emotes'
            subtitle='staggered mounts of the same emote, frame-locked or not'
            icon={{ icon: 'metronome', color: theme.colorOrange }}
            onPress={() => router.push('/dev-tools/synced-emotes')}
          />
          <SettingsLinkRow
            title='Channel Surfing'
            subtitle='Load an EAS Update from a different channel or PR branch'
            icon={{
              icon: 'antenna.radiowaves.left.and.right',
              color: theme.colorPlum,
            }}
            onPress={() => router.push('/tabs/settings/channel-surfing')}
          />
          <SettingsLinkRow
            title='Storybook'
            subtitle='Component previews and design-system inspection'
            icon={{ icon: 'book.closed', color: theme.colorTeal }}
            onPress={() => router.push('/tabs/settings/storybook')}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  iosHost: {
    flex: 1,
  },
});
