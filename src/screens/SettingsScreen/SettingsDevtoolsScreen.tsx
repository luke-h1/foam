import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';
import { usePreferences } from '@app/store/preferenceStore';
import {
  Button,
  Form,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';

export function SettingsDevtoolsScreen() {
  const { disableChat, disableStream, update } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title='Diagnostics'>
            <Button
              label='App Diagnostics'
              systemImage='stethoscope'
              onPress={() => router.push('/tabs/settings/diagnostics')}
            />
            <Button
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

          <Section title='Developer Tools'>
            <Button
              label='Debug'
              systemImage='ladybug'
              onPress={() => router.push('/tabs/settings/debug')}
            />
            <Button
              label='Cached Images'
              systemImage='photo.stack'
              onPress={() => router.push('/tabs/settings/cached-images')}
            />
            <Button
              label='Changelog Demo'
              systemImage='list.bullet.rectangle'
              onPress={() => router.push('/dev-tools/changelog')}
            />
            <Button
              label='Sentry Test'
              systemImage='exclamationmark.triangle'
              onPress={() => router.push('/dev-tools/sentry-demo')}
            />
            <Button
              label='Channel Surfing'
              systemImage='antenna.radiowaves.left.and.right'
              onPress={() => router.push('/tabs/settings/channel-surfing')}
            />
            <Button
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
        showsVerticalScrollIndicator={false}
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
