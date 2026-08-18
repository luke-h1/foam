import { Picker, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import type { Preferences } from '@app/store/preferenceStore';

import { DELETED_STYLE_OPTIONS } from './chatPreferenceTypes';

export function ChatPreferenceFormModerationSection({
  preferences,
  update,
}: {
  preferences: Preferences;
  update: (payload: Partial<Preferences>) => void;
}) {
  return (
    <Section title='Moderation'>
      <Picker
        label='Deleted Messages'
        systemImage='trash.slash'
        selection={preferences.deletedMessageStyle}
        onSelectionChange={value => update({ deletedMessageStyle: value })}
      >
        {DELETED_STYLE_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      <Toggle
        label='Keep History on Clear'
        systemImage='clock.arrow.circlepath'
        isOn={preferences.ignoreClearChat === true}
        onIsOnChange={value => update({ ignoreClearChat: value })}
      />
    </Section>
  );
}
