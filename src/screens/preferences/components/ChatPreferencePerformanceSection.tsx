import {
  SettingsSection,
  SettingsSegmentedRow,
} from '@app/components/settings-section/SettingsSection';
import { Text } from '@app/components/ui/text/Text';
import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  SCROLLBACK_OPTIONS,
} from '../constants';

export function ChatPreferencePerformanceSection() {
  const chatScrollback = usePreference('chatScrollback');

  return (
    <SettingsSection
      title={CHAT_PREFERENCE_SECTION_TITLES.performance}
      footer={
        <Text color='gray.textLow' type='subhead'>
          {CHAT_PREFERENCE_FOOTERS.performance}
        </Text>
      }
    >
      <SettingsSegmentedRow
        title={ROWS.scrollback.title}
        subtitle={ROWS.scrollback.subtitle}
        icon={ROWS.scrollback}
        options={SCROLLBACK_OPTIONS}
        value={chatScrollback}
        onValueChange={value => updatePreferences({ chatScrollback: value })}
      />
    </SettingsSection>
  );
}
