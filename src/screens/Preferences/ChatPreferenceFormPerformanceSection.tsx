import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import type { Preferences } from '@app/store/preferenceStore';

import { SCROLLBACK_OPTIONS } from './chatPreferenceTypes';

export function ChatPreferenceFormPerformanceSection({
  preferences,
  update,
}: {
  preferences: Preferences;
  update: (payload: Partial<Preferences>) => void;
}) {
  return (
    <Section
      title='Performance'
      footer={
        <NativeText>
          Longer scrollback keeps more messages in memory; 200 is easier on
          older devices.
        </NativeText>
      }
    >
      <Picker
        label='Scrollback'
        systemImage='text.line.last.and.arrowtriangle.forward'
        selection={preferences.chatScrollback}
        onSelectionChange={value => update({ chatScrollback: value })}
      >
        {SCROLLBACK_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
    </Section>
  );
}
