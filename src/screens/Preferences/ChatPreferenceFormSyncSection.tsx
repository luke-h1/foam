import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import type { Preferences } from '@app/store/preferenceStore';

import { CHAT_DELAY_OPTIONS } from './chatPreferenceTypes';

export function ChatPreferenceFormSyncSection({
  preferences,
  update,
}: {
  preferences: Preferences;
  update: (payload: Partial<Preferences>) => void;
}) {
  return (
    <Section
      title='Sync'
      footer={
        <NativeText>
          Delay chat so it lines up with the video. Auto matches the measured
          stream latency.
        </NativeText>
      }
    >
      <Picker
        label='Chat Delay'
        systemImage='timer'
        selection={String(preferences.chatDelay)}
        onSelectionChange={value => {
          const option = CHAT_DELAY_OPTIONS.find(
            item => String(item.value) === value,
          );
          if (option) {
            update({ chatDelay: option.value });
          }
        }}
      >
        {CHAT_DELAY_OPTIONS.map(option => (
          // SwiftUI tag matching needs one type; the values mix 'auto'/'off' and numbers.
          <NativeText
            key={option.value}
            modifiers={[tag(String(option.value))]}
          >
            {option.label}
          </NativeText>
        ))}
      </Picker>
    </Section>
  );
}
