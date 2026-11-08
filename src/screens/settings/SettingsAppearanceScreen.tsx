import { useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import { SHAKE_TO_REPORT_ICON } from './constants';

/**
 * Haptics and shake to report. The route keeps its `appearance` name so
 * existing links still resolve.
 */
export function SettingsAppearanceScreen() {
  const hapticFeedback = usePreference('hapticFeedback');
  const shakeToReport = usePreference('shakeToReport');
  const scrollRef = useRef<ScrollViewInstance>(null);

  useScrollToTop(scrollRef);

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
            subtitle='Vibrate on send, refresh and setting changes'
            icon={{ icon: 'hand.tap' }}
            value={hapticFeedback}
            onValueChange={value =>
              updatePreferences({ hapticFeedback: value })
            }
          />
          <SettingsToggleRow
            title='Shake to report a problem'
            subtitle='Shake your phone to open the feedback form'
            icon={{ icon: SHAKE_TO_REPORT_ICON }}
            value={shakeToReport}
            onValueChange={value => updatePreferences({ shakeToReport: value })}
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
});
