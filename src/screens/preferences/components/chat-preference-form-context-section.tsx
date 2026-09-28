import { StyleSheet, View } from 'react-native';

import { Picker, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import type { Preferences } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import type { ContextPreviewValue } from '../util/chat-preference-types';
import { TIMESTAMP_FORMAT_OPTIONS } from '../util/chat-preference-types';
import { hostPreview } from './chat-preference-form-host-preview';
import { PreviewLabel } from './chat-preference-preview-widgets';
import { ChatPreferencePreview } from './chat-preferences-preview';

interface ChatPreferenceFormContextSectionProps {
  contextPreview: ContextPreviewValue;
  preferences: Preferences;
  previewWidth: number;
  update: (payload: Partial<Preferences>) => void;
}

export function ChatPreferenceFormContextSection({
  contextPreview,
  preferences,
  previewWidth,
  update,
}: ChatPreferenceFormContextSectionProps) {
  return (
    <Section title='Context'>
      <Toggle
        label='Historical Recent Messages'
        systemImage='clock.arrow.circlepath'
        isOn={preferences.showRecentMessages}
        onIsOnChange={value => update({ showRecentMessages: value })}
      />
      <Toggle
        label='Show Timestamps'
        systemImage='clock'
        isOn={preferences.chatTimestamps}
        onIsOnChange={value => update({ chatTimestamps: value })}
      />
      <Toggle
        label='Highlight Own Mentions'
        systemImage='at'
        isOn={preferences.highlightOwnMentions}
        onIsOnChange={value => update({ highlightOwnMentions: value })}
      />
      <Toggle
        label='Inline Reply Context'
        systemImage='arrowshape.turn.up.left'
        isOn={preferences.showInlineReplyContext}
        onIsOnChange={value => update({ showInlineReplyContext: value })}
      />
      <Toggle
        label='Show Jump Pill'
        systemImage='arrow.down.circle'
        isOn={preferences.showUnreadJumpPill}
        onIsOnChange={value => update({ showUnreadJumpPill: value })}
      />
      <Picker
        label='Timestamp Format'
        systemImage='clock.badge'
        selection={preferences.chatTimestampFormat}
        onSelectionChange={value => update({ chatTimestampFormat: value })}
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
