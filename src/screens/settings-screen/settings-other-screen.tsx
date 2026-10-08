import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Form,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';
import { Text } from '@app/components/ui/text/text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

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
            footer={
              <NativeText>
                Foam sends anonymous usage data, such as which screens you open,
                to improve the app. Screen names can include channel names. The
                data never links to your Twitch account and never includes chat
                messages.
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
          footer={
            <Text type='subhead' color='gray.textLow'>
              Foam sends anonymous usage data, such as which screens you open,
              to improve the app. Screen names can include channel names. The
              data never links to your Twitch account and never includes chat
              messages.
            </Text>
          }
        >
          <SettingsToggleRow
            title='Share analytics'
            subtitle='Help improve Foam with anonymous usage data'
            icon={{ icon: 'chart.bar' }}
            value={analyticsEnabled}
            onValueChange={value => update({ analyticsEnabled: value })}
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
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
  iosHost: {
    flex: 1,
  },
});
