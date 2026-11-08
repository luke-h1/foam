import { StyleSheet } from 'react-native';

import {
  Form,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import { ANALYTICS_FOOTER } from './constants';

export function SettingsOtherScreen() {
  const analyticsEnabled = usePreference('analyticsEnabled');

  return (
    <Host style={styles.host}>
      <Form>
        <Section footer={<NativeText>{ANALYTICS_FOOTER}</NativeText>}>
          <Toggle
            label='Share analytics'
            systemImage='chart.bar'
            isOn={analyticsEnabled}
            onIsOnChange={value =>
              updatePreferences({ analyticsEnabled: value })
            }
          />
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
