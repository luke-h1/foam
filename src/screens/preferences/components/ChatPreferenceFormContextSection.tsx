import { StyleSheet, View } from 'react-native';

import { Picker, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { CONTEXT_TOGGLE_ROWS } from '@app/constants/chat-preferences';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  TIMESTAMP_FORMAT_OPTIONS,
} from '../constants';
import { useContextPreview } from '../hooks/use-context-preview';
import { hostPreview } from './ChatPreferenceFormHostPreview';
import { PreviewLabel } from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatPreferenceFormContextSection({
  previewWidth,
}: {
  previewWidth: number;
}) {
  const showRecentMessages = usePreference('showRecentMessages');
  const chatTimestampFormat = usePreference('chatTimestampFormat');
  const contextPreview = useContextPreview();

  return (
    <Section title={CHAT_PREFERENCE_SECTION_TITLES.context}>
      <Toggle
        label={ROWS.recentMessages.title}
        systemImage={ROWS.recentMessages.icon}
        isOn={showRecentMessages}
        onIsOnChange={value => updatePreferences({ showRecentMessages: value })}
      />
      {CONTEXT_TOGGLE_ROWS.map(row => (
        <Toggle
          key={row.key}
          label={row.label}
          systemImage={row.icon}
          isOn={contextPreview[row.key]}
          onIsOnChange={value => updatePreferences({ [row.key]: value })}
        />
      ))}
      <Picker
        label={ROWS.timestampFormat.title}
        systemImage={ROWS.timestampFormat.icon}
        selection={chatTimestampFormat}
        onSelectionChange={value =>
          updatePreferences({ chatTimestampFormat: value })
        }
      >
        {TIMESTAMP_FORMAT_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      {hostPreview(
        <View>
          <PreviewLabel />
          <View style={styles.previewSpacer}>
            <ChatPreferencePreview variant='context' value={contextPreview} />
          </View>
        </View>,
        previewWidth,
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  previewSpacer: {
    marginTop: theme.space8,
  },
});
