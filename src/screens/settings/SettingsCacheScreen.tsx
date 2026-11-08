import { useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';

import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/settings-section/SettingsSection';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { theme } from '@app/styles/themes';

import { confirmClearCache, confirmClearSavedData } from './util/cacheActions';

export function SettingsCacheScreen() {
  const scrollRef = useRef<ScrollViewInstance>(null);

  useScrollToTop(scrollRef);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.content}
      >
        <SettingsSection>
          <SettingsLinkRow
            title='Clear cache'
            subtitle='Emotes, badges and images download again when needed'
            icon={{ icon: 'trash' }}
            onPress={confirmClearCache}
            danger
          />
          <SettingsLinkRow
            title='Clear saved data'
            subtitle='Loads everything fresh. You stay signed in'
            icon={{ icon: 'externaldrive' }}
            onPress={confirmClearSavedData}
            danger
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
