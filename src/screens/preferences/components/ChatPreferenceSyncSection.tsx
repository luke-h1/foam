import {
  SettingsSection,
  SettingsSegmentedRow,
} from '@app/components/settings-section/SettingsSection';
import { Text } from '@app/components/ui/text/Text';
import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_DELAY_OPTIONS,
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';

export function ChatPreferenceSyncSection() {
  const chatDelay = usePreference('chatDelay');

  return (
    <SettingsSection
      title={CHAT_PREFERENCE_SECTION_TITLES.sync}
      footer={
        <Text color='gray.textLow' type='subhead'>
          {CHAT_PREFERENCE_FOOTERS.sync}
        </Text>
      }
    >
      <SettingsSegmentedRow
        title={ROWS.chatDelay.title}
        subtitle={ROWS.chatDelay.subtitle}
        icon={ROWS.chatDelay}
        options={CHAT_DELAY_OPTIONS}
        value={chatDelay}
        onValueChange={value => updatePreferences({ chatDelay: value })}
      />
    </SettingsSection>
  );
}
