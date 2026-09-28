import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Form as NativeForm,
  Host,
  LabeledContent,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';

import {
  SettingsLinkRow,
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

const themeLabels = {
  'foam-dark': 'Foam Dark',
} satisfies Record<'foam-dark', string>;

export function SettingsAppearanceScreen() {
  const selectedTheme = usePreference('theme');
  const hapticFeedback = usePreference('hapticFeedback');
  const shakeToReport = usePreference('shakeToReport');
  const update = useUpdatePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <NativeForm>
          <Section
            title='Theme'
            footer={
              <NativeText>
                Foam currently ships with one canonical visual mode. Additional
                themes will appear here as they become available.
              </NativeText>
            }
          >
            <LabeledContent label='Theme'>
              <NativeText>{themeLabels[selectedTheme]}</NativeText>
            </LabeledContent>
          </Section>
          <Section
            title='Feedback'
            footer={
              <NativeText>
                Subtle vibrations for actions like sending messages and
                refreshing
              </NativeText>
            }
          >
            <Toggle
              label='Haptics'
              systemImage='hand.tap'
              isOn={hapticFeedback}
              onIsOnChange={value => update({ hapticFeedback: value })}
            />
            <Toggle
              label='Shake to report a problem'
              systemImage='iphone.gen3.radiowaves.left.and.right'
              isOn={shakeToReport}
              onIsOnChange={value => update({ shakeToReport: value })}
            />
          </Section>
        </NativeForm>
      </Host>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        indicatorStyle='white'
        contentContainerStyle={styles.content}
      >
        <SettingsSection
          title='Theme'
          footer={
            <Text type='xs' color='gray.textLow'>
              Foam currently ships with one canonical visual mode. Additional
              themes will appear here as they become available.
            </Text>
          }
        >
          <SettingsLinkRow
            title='Theme'
            icon={{ icon: 'moon', color: theme.colorAmber }}
            value={themeLabels[selectedTheme]}
          />
        </SettingsSection>
        <SettingsSection title='Feedback'>
          <SettingsToggleRow
            title='Haptics'
            subtitle='Subtle vibrations for actions like sending messages and refreshing'
            icon={{ icon: 'hand.tap', color: theme.colorTeal }}
            value={hapticFeedback}
            onValueChange={value => update({ hapticFeedback: value })}
          />
          <SettingsToggleRow
            title='Shake to report'
            subtitle='Shake your device to report a problem'
            icon={{ icon: 'waveform.path', color: theme.colorAmber }}
            value={shakeToReport}
            onValueChange={value => update({ shakeToReport: value })}
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
