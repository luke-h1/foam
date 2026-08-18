import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export function ChatPreferenceHighlightsSection({
  chatMentionHaptics,
  onChatMentionHapticsChange,
}: {
  chatMentionHaptics: boolean | undefined;
  onChatMentionHapticsChange: (value: boolean) => void;
}) {
  return (
    <SettingsSection
      title='Highlights'
      footer={
        <Text color='gray.textLow' type='xs'>
          Highlighted phrases tint matching messages. Mention feedback also
          buzzes when a highlight matches.
        </Text>
      }
    >
      <SettingsLinkRow
        title='Highlighted Phrases'
        subtitle='Tint messages containing custom phrases'
        icon={{
          icon: 'highlighter',
          androidIcon: 'edit',
          color: theme.colorGrey,
        }}
        onPress={() => router.push('/tabs/settings/chat-highlights')}
      />
      <SettingsToggleRow
        title='Mention Feedback'
        subtitle='Buzz when a message mentions you or matches a highlight'
        icon={{
          icon: 'hand.tap',
          androidIcon: 'touch_app',
          color: theme.colorGrey,
        }}
        value={chatMentionHaptics !== false}
        onValueChange={onChatMentionHapticsChange}
      />
    </SettingsSection>
  );
}
