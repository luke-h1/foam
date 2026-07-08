import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
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

export function SettingsDevtoolsScreen() {
  const { t } = useTranslation('settings');
  const {
    disableChat,
    disableStream,
    sharedChatEnabled,
    enhancedVideoStability,
    update,
  } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title={t('diagnostics')}>
            <Button
              label={t('appDiagnostics')}
              systemImage='stethoscope'
              onPress={() => router.push('/tabs/settings/diagnostics')}
            />
            <Button
              label={t('remoteConfig')}
              systemImage='cloud'
              onPress={() => router.push('/tabs/settings/remote-config')}
            />
          </Section>

          <Section title={t('streamDiagnostics')}>
            <Toggle
              isOn={disableStream}
              onIsOnChange={value => update({ disableStream: value })}
            >
              <NativeText>{t('disableStream')}</NativeText>
              <NativeText>{t('disableStreamDescription')}</NativeText>
            </Toggle>
            <Toggle
              isOn={disableChat}
              onIsOnChange={value => update({ disableChat: value })}
            >
              <NativeText>{t('disableChat')}</NativeText>
              <NativeText>{t('disableChatDescription')}</NativeText>
            </Toggle>
          </Section>

          <Section title={t('featureFlags')}>
            <Toggle
              isOn={sharedChatEnabled}
              onIsOnChange={value => update({ sharedChatEnabled: value })}
            >
              <NativeText>{t('sharedChat')}</NativeText>
              <NativeText>{t('sharedChatDescription')}</NativeText>
            </Toggle>
            <Toggle
              isOn={enhancedVideoStability}
              onIsOnChange={value => update({ enhancedVideoStability: value })}
            >
              <NativeText>{t('enhancedVideoStability')}</NativeText>
              <NativeText>{t('enhancedVideoStabilityDescription')}</NativeText>
            </Toggle>
          </Section>

          <Section title={t('developerTools')}>
            <Button
              label={t('debug')}
              systemImage='ladybug'
              onPress={() => router.push('/tabs/settings/debug')}
            />
            <Button
              label={t('cachedImages')}
              systemImage='photo.stack'
              onPress={() => router.push('/tabs/settings/cached-images')}
            />
            <Button
              label={t('changelogDemo')}
              systemImage='list.bullet.rectangle'
              onPress={() => router.push('/dev-tools/changelog')}
            />
            <Button
              label={t('sentryTest')}
              systemImage='exclamationmark.triangle'
              onPress={() => router.push('/dev-tools/sentry-demo')}
            />
            <Button
              label={t('imageBenchmark')}
              systemImage='speedometer'
              onPress={() => router.push('/dev-tools/image-benchmark')}
            />
            <Button
              label={t('chatPerfBurstTest')}
              systemImage='bolt.horizontal'
              onPress={() => router.push('/dev-tools/chat-perf')}
            />
            <Button
              label={t('envVars')}
              systemImage='doc.text'
              onPress={() => router.push('/dev-tools/env-vars')}
            />
            <Button
              label={t('channelSurfing')}
              systemImage='antenna.radiowaves.left.and.right'
              onPress={() => router.push('/tabs/settings/channel-surfing')}
            />
            <Button
              label={t('storybook')}
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
        <SettingsSection title={t('diagnostics')}>
          <SettingsLinkRow
            title={t('appDiagnostics')}
            subtitle={t('appDiagnosticsDescription')}
            icon={{ icon: 'stethoscope', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/diagnostics')}
          />
          <SettingsLinkRow
            title={t('remoteConfig')}
            subtitle={t('remoteConfigDescription')}
            icon={{ icon: 'cloud', color: theme.colorPlum }}
            onPress={() => router.push('/tabs/settings/remote-config')}
          />
        </SettingsSection>

        <SettingsSection title={t('streamDiagnostics')}>
          <SettingsToggleRow
            title={t('disableStream')}
            subtitle={t('disableStreamDescription')}
            icon={{ icon: 'video.slash', color: theme.colorOrange }}
            value={disableStream}
            onValueChange={value => update({ disableStream: value })}
          />
          <SettingsToggleRow
            title={t('disableChat')}
            subtitle={t('disableChatDescription')}
            icon={{ icon: 'message', color: theme.colorPlum }}
            value={disableChat}
            onValueChange={value => update({ disableChat: value })}
          />
        </SettingsSection>

        <SettingsSection title={t('featureFlags')}>
          <SettingsToggleRow
            title={t('sharedChat')}
            subtitle={t('sharedChatDescription')}
            icon={{
              icon: 'bubble.left.and.bubble.right',
              color: theme.colorTeal,
            }}
            value={sharedChatEnabled}
            onValueChange={value => update({ sharedChatEnabled: value })}
          />
          <SettingsToggleRow
            title={t('enhancedVideoStability')}
            subtitle={t('enhancedVideoStabilityDescription')}
            icon={{ icon: 'wand.and.stars', color: theme.colorBlue }}
            value={enhancedVideoStability}
            onValueChange={value => update({ enhancedVideoStability: value })}
          />
        </SettingsSection>

        <SettingsSection title={t('developerTools')}>
          <SettingsLinkRow
            title={t('debug')}
            subtitle={t('debugDescription')}
            icon={{ icon: 'ladybug', color: theme.colorOrange }}
            onPress={() => router.push('/tabs/settings/debug')}
          />
          <SettingsLinkRow
            title={t('cachedImages')}
            subtitle={t('cachedImagesDescription')}
            icon={{ icon: 'photo.stack', color: theme.colorPrimary }}
            onPress={() => router.push('/tabs/settings/cached-images')}
          />
          <SettingsLinkRow
            title={t('changelogDemo')}
            subtitle={t('changelogDemoDescription')}
            icon={{ icon: 'list.bullet.rectangle', color: theme.colorBlue }}
            onPress={() => router.push('/dev-tools/changelog')}
          />
          <SettingsLinkRow
            title={t('sentryTest')}
            subtitle={t('sentryTestDescription')}
            icon={{
              icon: 'exclamationmark.triangle',
              color: theme.colorRed,
            }}
            onPress={() => router.push('/dev-tools/sentry-demo')}
          />
          <SettingsLinkRow
            title={t('imageBenchmark')}
            subtitle={t('imageBenchmarkDescription')}
            icon={{ icon: 'speedometer', color: theme.colorTeal }}
            onPress={() => router.push('/dev-tools/image-benchmark')}
          />
          <SettingsLinkRow
            title={t('chatPerfBurstTest')}
            subtitle={t('chatPerfBurstTestDescription')}
            icon={{ icon: 'bolt.horizontal', color: theme.colorOrange }}
            onPress={() => router.push('/dev-tools/chat-perf')}
          />
          <SettingsLinkRow
            title={t('envVars')}
            subtitle={t('envVarsDescription')}
            icon={{ icon: 'doc.text', color: theme.colorTeal }}
            onPress={() => router.push('/dev-tools/env-vars')}
          />
          <SettingsLinkRow
            title={t('channelSurfing')}
            subtitle={t('channelSurfingDescription')}
            icon={{
              icon: 'antenna.radiowaves.left.and.right',
              color: theme.colorPlum,
            }}
            onPress={() => router.push('/tabs/settings/channel-surfing')}
          />
          <SettingsLinkRow
            title={t('storybook')}
            subtitle={t('storybookDescription')}
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
