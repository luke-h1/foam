import { Picker, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  DELETED_STYLE_OPTIONS,
} from '../constants';

export function ChatPreferenceFormModerationSection() {
  const deletedMessageStyle = usePreference('deletedMessageStyle');
  const ignoreClearChat = usePreference('ignoreClearChat');

  return (
    <Section title={CHAT_PREFERENCE_SECTION_TITLES.moderation}>
      <Picker
        label={ROWS.deletedMessages.title}
        systemImage={ROWS.deletedMessages.icon}
        selection={deletedMessageStyle}
        onSelectionChange={value =>
          updatePreferences({ deletedMessageStyle: value })
        }
      >
        {DELETED_STYLE_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      <Toggle
        label={ROWS.keepHistoryOnClear.title}
        systemImage={ROWS.keepHistoryOnClear.icon}
        isOn={ignoreClearChat}
        onIsOnChange={value => updatePreferences({ ignoreClearChat: value })}
      />
    </Section>
  );
}
