import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';

import { DELETED_STYLE_OPTIONS } from '../util/chat-preference-types';
import { ChatPreferenceSegmentedSettingsRow } from './chat-preference-settings-rows';

interface ChatPreferenceModerationSectionProps {
  deletedStyleIndex: number;
  handleDeletedStyleChange: (index: number) => void;
  ignoreClearChat: boolean | undefined;
  onIgnoreClearChatChange: (value: boolean) => void;
}

export function ChatPreferenceModerationSection({
  deletedStyleIndex,
  handleDeletedStyleChange,
  ignoreClearChat,
  onIgnoreClearChatChange,
}: ChatPreferenceModerationSectionProps) {
  return (
    <SettingsSection title='Moderation'>
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'trash.slash',
          androidIcon: 'delete',
        }}
        onSelectIndex={handleDeletedStyleChange}
        selectedIndex={deletedStyleIndex}
        subtitle='How removed messages appear in chat'
        title='Deleted Messages'
        values={DELETED_STYLE_OPTIONS.map(option => option.label)}
      />
      <SettingsToggleRow
        title='Keep History on Clear'
        subtitle='Keep scrollback when a moderator clears chat'
        icon={{
          icon: 'clock.arrow.circlepath',
          androidIcon: 'history',
        }}
        value={ignoreClearChat === true}
        onValueChange={onIgnoreClearChatChange}
      />
    </SettingsSection>
  );
}
