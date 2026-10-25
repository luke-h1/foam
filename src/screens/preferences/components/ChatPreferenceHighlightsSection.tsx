import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { Text } from '@app/components/ui/text/Text';

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
        <Text color='gray.textLow' type='subhead'>
          Highlighted phrases tint matching messages. Mention feedback also
          buzzes on a match.
        </Text>
      }
    >
      <SettingsLinkRow
        title='Highlighted Phrases'
        subtitle='Tint messages containing custom phrases'
        icon={{
          icon: 'highlighter',
          androidIcon: 'edit',
        }}
        onPress={() => router.push('/tabs/settings/chat-highlights')}
      />
      <SettingsToggleRow
        title='Mention Feedback'
        subtitle='Buzz on mentions and highlight matches'
        icon={{
          icon: 'hand.tap',
          androidIcon: 'touch_app',
        }}
        value={chatMentionHaptics !== false}
        onValueChange={onChatMentionHapticsChange}
      />
    </SettingsSection>
  );
}
