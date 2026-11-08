import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_DELAY_OPTIONS,
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';
import { chatDelayOptionTag } from '../util/chatPreferenceOptions';

function handleSelectionChange(selectedTag: string) {
  const option = CHAT_DELAY_OPTIONS.find(
    item => chatDelayOptionTag(item.value) === selectedTag,
  );

  if (option) {
    updatePreferences({ chatDelay: option.value });
  }
}

export function ChatPreferenceFormSyncSection() {
  const chatDelay = usePreference('chatDelay');

  return (
    <Section
      title={CHAT_PREFERENCE_SECTION_TITLES.sync}
      footer={<NativeText>{CHAT_PREFERENCE_FOOTERS.sync}</NativeText>}
    >
      <Picker
        label={ROWS.chatDelay.title}
        systemImage={ROWS.chatDelay.icon}
        selection={chatDelayOptionTag(chatDelay)}
        onSelectionChange={handleSelectionChange}
      >
        {CHAT_DELAY_OPTIONS.map(option => (
          <NativeText
            key={option.value}
            modifiers={[tag(chatDelayOptionTag(option.value))]}
          >
            {option.label}
          </NativeText>
        ))}
      </Picker>
    </Section>
  );
}
