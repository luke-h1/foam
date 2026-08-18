import { Button, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import type { Preferences } from '@app/store/preferenceStore';

export function ChatPreferenceFormHighlightsSection({
  preferences,
  update,
}: {
  preferences: Preferences;
  update: (payload: Partial<Preferences>) => void;
}) {
  return (
    <Section
      title='Highlights'
      footer={
        <NativeText>
          Highlighted phrases tint matching messages. Mention feedback also
          buzzes when a highlight matches.
        </NativeText>
      }
    >
      <Button
        label='Highlighted Phrases'
        systemImage='highlighter'
        onPress={() => router.push('/tabs/settings/chat-highlights')}
      />
      <Toggle
        label='Mention Feedback'
        systemImage='hand.tap'
        isOn={preferences.chatMentionHaptics !== false}
        onIsOnChange={value => update({ chatMentionHaptics: value })}
      />
    </Section>
  );
}
