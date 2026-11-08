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
import { updatePreferences } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import { useDevtoolsToggleValues } from './hooks/use-devtools-toggle-values';
import {
  DEVTOOLS_DIAGNOSTICS_ROUTES,
  DEVTOOLS_ROUTES,
  DEVTOOLS_TOGGLE_SECTIONS,
} from './util/settingsMenu';
import { toLinkRow } from './util/toLinkRow';

export function SettingsDevtoolsScreen() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const toggleValues = useDevtoolsToggleValues();

  useScrollToTop(scrollRef);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.content}
      >
        <SettingsSection title='Diagnostics'>
          {DEVTOOLS_DIAGNOSTICS_ROUTES.map(toLinkRow)}
        </SettingsSection>

        {/* oxlint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- two fixed toggle sections */}
        {DEVTOOLS_TOGGLE_SECTIONS.map(section => (
          <SettingsSection key={section.title} title={section.title}>
            {section.toggles.map(toggle => (
              <SettingsToggleRow
                key={toggle.key}
                title={toggle.label}
                subtitle={toggle.subtitle}
                icon={toggle}
                value={toggleValues[toggle.key]}
                onValueChange={value =>
                  updatePreferences({ [toggle.key]: value })
                }
              />
            ))}
          </SettingsSection>
        ))}

        <SettingsSection title='Developer Tools'>
          {DEVTOOLS_ROUTES.map(toLinkRow)}
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
});
