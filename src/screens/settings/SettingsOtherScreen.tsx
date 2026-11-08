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
import { Text } from '@app/components/ui/text/Text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import { ANALYTICS_FOOTER } from './constants';

export function SettingsOtherScreen() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const analyticsEnabled = usePreference('analyticsEnabled');

  useScrollToTop(scrollRef);

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
              {ANALYTICS_FOOTER}
            </Text>
          }
        >
          <SettingsToggleRow
            title='Share analytics'
            subtitle='Help improve Foam with anonymous usage data'
            icon={{ icon: 'chart.bar' }}
            value={analyticsEnabled}
            onValueChange={value =>
              updatePreferences({ analyticsEnabled: value })
            }
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
