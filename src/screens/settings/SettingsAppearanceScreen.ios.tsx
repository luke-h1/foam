import { StyleSheet } from 'react-native';

import {
  Form as NativeForm,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import { SHAKE_TO_REPORT_ICON } from './constants';

/**
 * Haptics and shake to report. The route keeps its `appearance` name so
 * existing links still resolve.
 */
export function SettingsAppearanceScreen() {
  const hapticFeedback = usePreference('hapticFeedback');
  const shakeToReport = usePreference('shakeToReport');

  return (
    <Host style={styles.host}>
      <NativeForm>
        <Section
          footer={
            <NativeText>
              Vibrate when you send a message, refresh, or change a setting.
            </NativeText>
          }
        >
          <Toggle
            label='Haptics'
            systemImage='hand.tap'
            isOn={hapticFeedback}
            onIsOnChange={value => updatePreferences({ hapticFeedback: value })}
          />
        </Section>
        <Section
          footer={
            <NativeText>Shake your phone to open the feedback form.</NativeText>
          }
        >
          <Toggle
            label='Shake to report a problem'
            systemImage={SHAKE_TO_REPORT_ICON}
            isOn={shakeToReport}
            onIsOnChange={value => updatePreferences({ shakeToReport: value })}
          />
        </Section>
      </NativeForm>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
