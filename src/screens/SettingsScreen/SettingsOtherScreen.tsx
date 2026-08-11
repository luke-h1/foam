import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  Form,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

export function SettingsOtherScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const analyticsEnabled = usePreference('analyticsEnabled');
  const update = useUpdatePreferences();

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section
            title='Privacy'
            footer={
              <NativeText>
                When on, Foam sends anonymous usage data (such as which screens
                are opened, which can include channel names) to help improve the
                app. It is never linked to your Twitch account, and no chat
                messages are collected. Turn this off to opt out.
              </NativeText>
            }
          >
            <Toggle
              label='Share analytics'
              systemImage='chart.bar'
              isOn={analyticsEnabled}
              onIsOnChange={value => update({ analyticsEnabled: value })}
            />
          </Section>
          <Section title='Support & Feedback'>
            <Button
              label='FAQ'
              systemImage='questionmark.circle'
              onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
            />
            {/*<Button
              label={t('changelog')}
              systemImage='clock'
              onPress={() => router.push('/tabs/settings/changelog')}
            />*/}
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
        <SettingsSection
          title='Privacy'
          footer={
            <Text type='xs' color='gray.textLow'>
              When on, Foam sends anonymous usage data (such as which screens
              are opened, which can include channel names) to help improve the
              app. It is never linked to your Twitch account, and no chat
              messages are collected. Turn this off to opt out.
            </Text>
          }
        >
          <SettingsToggleRow
            title='Share analytics'
            subtitle='Help improve Foam with anonymous usage data'
            icon={{ icon: 'chart.bar', color: theme.colorTeal }}
            value={analyticsEnabled}
            onValueChange={value => update({ analyticsEnabled: value })}
          />
        </SettingsSection>

        <SettingsSection title='Support & Feedback'>
          <SettingsLinkRow
            title='FAQ'
            subtitle='Common questions and product guidance'
            icon={{ icon: 'questionmark.circle', color: theme.colorPrimary }}
            onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
          />
          {/*<SettingsLinkRow
            title={t('changelog')}
            subtitle={t('changelogDescription')}
            icon={{ icon: 'clock', color: theme.colorAmber }}
            onPress={() => router.push('/tabs/settings/changelog')}
          />*/}
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
