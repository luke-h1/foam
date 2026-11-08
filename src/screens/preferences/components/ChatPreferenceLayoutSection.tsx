import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsSegmentedRow,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { getOptionIndex } from '@app/components/settings-section/SettingsSection.types';
import { DENSITY_OPTIONS } from '@app/constants/chat-preferences';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  FONT_SCALE_OPTIONS,
} from '../constants';
import { DensityPreview } from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatPreferenceLayoutSection() {
  const chatDensity = usePreference('chatDensity');
  const chatFontScale = usePreference('chatFontScale');
  const showAlternatingChatRows = usePreference('showAlternatingChatRows');
  const animate = usePreference('animate');

  const densitySubtitle =
    DENSITY_OPTIONS[getOptionIndex(DENSITY_OPTIONS, chatDensity)]?.subtitle;

  return (
    <SettingsSection title={CHAT_PREFERENCE_SECTION_TITLES.layout}>
      <SettingsSegmentedRow
        title={ROWS.density.title}
        subtitle={densitySubtitle}
        icon={ROWS.density}
        options={DENSITY_OPTIONS}
        value={chatDensity}
        onValueChange={value => updatePreferences({ chatDensity: value })}
      />
      <View style={styles.settingsPreviewItem}>
        <DensityPreview density={chatDensity} />
      </View>
      <SettingsSegmentedRow
        title={ROWS.fontScale.title}
        subtitle={ROWS.fontScale.subtitle}
        icon={ROWS.fontScale}
        options={FONT_SCALE_OPTIONS}
        value={chatFontScale}
        onValueChange={value => updatePreferences({ chatFontScale: value })}
      />
      <View style={styles.settingsPreviewItem}>
        <ChatPreferencePreview variant='fontScale' value={chatFontScale} />
      </View>
      <SettingsToggleRow
        title={ROWS.alternatingRows.title}
        subtitle={ROWS.alternatingRows.subtitle}
        icon={ROWS.alternatingRows}
        value={showAlternatingChatRows}
        onValueChange={value =>
          updatePreferences({ showAlternatingChatRows: value })
        }
      />
      <View style={styles.settingsPreviewItem}>
        <ChatPreferencePreview
          variant='alternatingRows'
          value={showAlternatingChatRows}
        />
      </View>
      <SettingsToggleRow
        title={ROWS.animate.title}
        subtitle={ROWS.animate.subtitle}
        icon={ROWS.animate}
        value={animate}
        onValueChange={value => updatePreferences({ animate: value })}
      />
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
