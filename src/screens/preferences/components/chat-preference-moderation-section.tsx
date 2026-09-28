import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';
import { theme } from '@app/styles/themes';

import { DELETED_STYLE_OPTIONS } from '../util/chat-preference-types';
import { ChatPreferenceSegmentedSettingsRow } from './chat-preference-settings-rows';

export function ChatPreferenceModerationSection({
  deletedStyleIndex,
  handleDeletedStyleChange,
  ignoreClearChat,
  onIgnoreClearChatChange,
}: {
  deletedStyleIndex: number;
  handleDeletedStyleChange: (index: number) => void;
  ignoreClearChat: boolean | undefined;
  onIgnoreClearChatChange: (value: boolean) => void;
}) {
  return (
    <SettingsSection title='Moderation'>
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'trash.slash',
          androidIcon: 'delete',
          color: theme.colorGrey,
        }}
        onSelectIndex={handleDeletedStyleChange}
        selectedIndex={deletedStyleIndex}
        subtitle='How removed messages appear in chat'
        title='Deleted Messages'
        values={DELETED_STYLE_OPTIONS.map(option => option.label)}
      />
      <SettingsToggleRow
        title='Keep History on Clear'
        subtitle='Ignore moderator chat clears and keep your scrollback'
        icon={{
          icon: 'clock.arrow.circlepath',
          androidIcon: 'history',
          color: theme.colorGrey,
        }}
        value={ignoreClearChat === true}
        onValueChange={onIgnoreClearChatChange}
      />
    </SettingsSection>
  );
}
