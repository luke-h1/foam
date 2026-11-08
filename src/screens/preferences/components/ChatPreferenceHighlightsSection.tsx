import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { Text } from '@app/components/ui/text/Text';
import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';

export function ChatPreferenceHighlightsSection() {
  const chatMentionHaptics = usePreference('chatMentionHaptics');

  return (
    <SettingsSection
      title={CHAT_PREFERENCE_SECTION_TITLES.highlights}
      footer={
        <Text color='gray.textLow' type='subhead'>
          {CHAT_PREFERENCE_FOOTERS.highlights}
        </Text>
      }
    >
      <SettingsLinkRow
        title={ROWS.highlightedPhrases.title}
        subtitle={ROWS.highlightedPhrases.subtitle}
        icon={ROWS.highlightedPhrases}
        onPress={() => router.push('/tabs/settings/chat-highlights')}
      />
      <SettingsToggleRow
        title={ROWS.mentionFeedback.title}
        subtitle={ROWS.mentionFeedback.subtitle}
        icon={ROWS.mentionFeedback}
        value={chatMentionHaptics}
        onValueChange={value =>
          updatePreferences({ chatMentionHaptics: value })
        }
      />
    </SettingsSection>
  );
}
