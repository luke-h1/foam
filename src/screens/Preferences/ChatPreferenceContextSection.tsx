import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';

import { PreviewLabel } from './ChatPreferencePreviewWidgets';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import {
  CONTEXT_TOGGLE_ROWS,
  type ContextPreviewKey,
  type ContextPreviewValue,
  TIMESTAMP_FORMAT_OPTIONS,
} from './chatPreferenceTypes';

export function ChatPreferenceContextSection({
  handleContextToggle,
  handleTimestampFormatChange,
  previewContext,
  onShowRecentMessagesChange,
  showRecentMessages,
  timestampFormatIndex,
}: {
  handleContextToggle: (key: ContextPreviewKey, value: boolean) => void;
  handleTimestampFormatChange: (index: number) => void;
  onShowRecentMessagesChange: (value: boolean) => void;
  previewContext: ContextPreviewValue;
  showRecentMessages: boolean | undefined;
  timestampFormatIndex: number;
}) {
  return (
    <SettingsSection title='Context'>
      <SettingsToggleRow
        title='Historical Recent Messages'
        subtitle='Loads historical recent messages in chat through the third-party API service at recent-messages.robotty.de.'
        icon={{
          icon: 'clock.arrow.circlepath',
          androidIcon: 'history',
          color: theme.colorGrey,
        }}
        value={showRecentMessages !== false}
        onValueChange={onShowRecentMessagesChange}
      />
      {CONTEXT_TOGGLE_ROWS.map(row => (
        <SettingsToggleRow
          key={row.key}
          title={row.label}
          subtitle={row.subtitle}
          icon={row.icon}
          value={previewContext[row.key]}
          onValueChange={value => handleContextToggle(row.key, value)}
        />
      ))}
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'clock.badge',
          androidIcon: 'schedule',
          color: theme.colorGrey,
        }}
        onSelectIndex={handleTimestampFormatChange}
        selectedIndex={timestampFormatIndex}
        subtitle='Applies to newly received messages'
        title='Timestamp Format'
        values={TIMESTAMP_FORMAT_OPTIONS.map(option => option.label)}
      />
      <View style={styles.settingsPreviewItem}>
        <PreviewLabel />
        <View style={styles.previewSpacer}>
          <ChatPreferencePreview variant='context' value={previewContext} />
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
