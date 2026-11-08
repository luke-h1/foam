import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  SCROLLBACK_OPTIONS,
} from '../constants';

export function ChatPreferenceFormPerformanceSection() {
  const chatScrollback = usePreference('chatScrollback');

  return (
    <Section
      title={CHAT_PREFERENCE_SECTION_TITLES.performance}
      footer={<NativeText>{CHAT_PREFERENCE_FOOTERS.performance}</NativeText>}
    >
      <Picker
        label={ROWS.scrollback.title}
        systemImage={ROWS.scrollback.icon}
        selection={chatScrollback}
        onSelectionChange={value =>
          updatePreferences({ chatScrollback: value })
        }
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
