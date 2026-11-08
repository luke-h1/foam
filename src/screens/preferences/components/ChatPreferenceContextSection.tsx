import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsSegmentedRow,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { CONTEXT_TOGGLE_ROWS } from '@app/constants/chat-preferences';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  TIMESTAMP_FORMAT_OPTIONS,
} from '../constants';
import { useContextPreview } from '../hooks/use-context-preview';
import { PreviewLabel } from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatPreferenceContextSection() {
  const showRecentMessages = usePreference('showRecentMessages');
  const chatTimestampFormat = usePreference('chatTimestampFormat');
  const contextPreview = useContextPreview();

  return (
    <SettingsSection title={CHAT_PREFERENCE_SECTION_TITLES.context}>
      <SettingsToggleRow
        title={ROWS.recentMessages.title}
        subtitle={ROWS.recentMessages.subtitle}
        icon={ROWS.recentMessages}
        value={showRecentMessages}
        onValueChange={value =>
          updatePreferences({ showRecentMessages: value })
        }
      />
      {CONTEXT_TOGGLE_ROWS.map(row => (
        <SettingsToggleRow
          key={row.key}
          title={row.label}
          subtitle={row.subtitle}
          icon={row}
          value={contextPreview[row.key]}
          onValueChange={value => updatePreferences({ [row.key]: value })}
        />
      ))}
      <SettingsSegmentedRow
        title={ROWS.timestampFormat.title}
        subtitle={ROWS.timestampFormat.subtitle}
        icon={ROWS.timestampFormat}
        options={TIMESTAMP_FORMAT_OPTIONS}
        value={chatTimestampFormat}
        onValueChange={value =>
          updatePreferences({ chatTimestampFormat: value })
        }
      />
      <View style={styles.settingsPreviewItem}>
        <PreviewLabel />
        <View style={styles.previewSpacer}>
          <ChatPreferencePreview variant='context' value={contextPreview} />
        </View>
      </View>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  previewSpacer: {
    marginTop: theme.space8,
  },
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
