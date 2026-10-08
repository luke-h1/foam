import { SettingsSection } from '@app/components/settings-section/settings-section';
import { Text } from '@app/components/ui/text/text';

import { CHAT_DELAY_OPTIONS } from '../util/chat-preference-types';
import { ChatPreferenceSegmentedSettingsRow } from './chat-preference-settings-rows';

export function ChatPreferenceSyncSection({
  chatDelayIndex,
  handleChatDelayChange,
}: {
  chatDelayIndex: number;
  handleChatDelayChange: (index: number) => void;
}) {
  return (
    <SettingsSection
      title='Sync'
      footer={
        <Text color='gray.textLow' type='subhead'>
          Delay chat to match the video. Auto uses the measured stream latency.
        </Text>
      }
    >
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'timer',
          androidIcon: 'timer',
        }}
        onSelectIndex={handleChatDelayChange}
        selectedIndex={chatDelayIndex}
        subtitle='Hold new messages before showing them'
        title='Chat Delay'
        values={CHAT_DELAY_OPTIONS.map(option => option.label)}
      />
    </SettingsSection>
  );
}
