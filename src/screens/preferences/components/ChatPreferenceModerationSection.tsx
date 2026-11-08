import {
  SettingsSection,
  SettingsSegmentedRow,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  DELETED_STYLE_OPTIONS,
} from '../constants';

export function ChatPreferenceModerationSection() {
  const deletedMessageStyle = usePreference('deletedMessageStyle');
  const ignoreClearChat = usePreference('ignoreClearChat');

  return (
    <SettingsSection title={CHAT_PREFERENCE_SECTION_TITLES.moderation}>
      <SettingsSegmentedRow
        title={ROWS.deletedMessages.title}
        subtitle={ROWS.deletedMessages.subtitle}
        icon={ROWS.deletedMessages}
        options={DELETED_STYLE_OPTIONS}
        value={deletedMessageStyle}
        onValueChange={value =>
          updatePreferences({ deletedMessageStyle: value })
        }
      />
      <SettingsToggleRow
        title={ROWS.keepHistoryOnClear.title}
        subtitle={ROWS.keepHistoryOnClear.subtitle}
        icon={ROWS.keepHistoryOnClear}
        value={ignoreClearChat}
        onValueChange={value => updatePreferences({ ignoreClearChat: value })}
      />
    </SettingsSection>
  );
}
