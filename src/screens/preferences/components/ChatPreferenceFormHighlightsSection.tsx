import { Button, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';

export function ChatPreferenceFormHighlightsSection() {
  const chatMentionHaptics = usePreference('chatMentionHaptics');

  return (
    <Section
      title={CHAT_PREFERENCE_SECTION_TITLES.highlights}
      footer={<NativeText>{CHAT_PREFERENCE_FOOTERS.highlights}</NativeText>}
    >
      <Button
        label={ROWS.highlightedPhrases.title}
        systemImage={ROWS.highlightedPhrases.icon}
        onPress={() => router.push('/tabs/settings/chat-highlights')}
      />
      <Toggle
        label={ROWS.mentionFeedback.title}
        systemImage={ROWS.mentionFeedback.icon}
        isOn={chatMentionHaptics}
        onIsOnChange={value => updatePreferences({ chatMentionHaptics: value })}
      />
    </Section>
  );
}
