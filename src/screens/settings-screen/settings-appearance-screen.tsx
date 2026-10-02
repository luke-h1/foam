import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Form as NativeForm,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

/**
 * Haptics and shake to report. The route keeps its `appearance` name so
 * existing links still resolve.
 */
export function SettingsAppearanceScreen() {
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
            footer={
              <NativeText>
                Short vibrations when you send a message, refresh, or change a
                setting.
              </NativeText>
            }
          >
            <Toggle
              label='Haptics'
              systemImage='hand.tap'
              isOn={hapticFeedback}
              onIsOnChange={value => update({ hapticFeedback: value })}
            />
          </Section>
          <Section
            footer={
              <NativeText>
                Shake your phone to open the feedback form.
              </NativeText>
            }
          >
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
        <SettingsSection>
          <SettingsToggleRow
            title='Haptics'
            subtitle='Short vibrations when you send a message, refresh, or change a setting'
            icon={{ icon: 'hand.tap' }}
            value={hapticFeedback}
            onValueChange={value => update({ hapticFeedback: value })}
          />
          <SettingsToggleRow
            title='Shake to report a problem'
            subtitle='Shake your phone to open the feedback form'
            icon={{ icon: 'waveform.path' }}
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
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
  iosHost: {
    flex: 1,
  },
});
