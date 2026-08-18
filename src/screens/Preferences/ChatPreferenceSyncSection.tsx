import { SettingsSection } from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import { CHAT_DELAY_OPTIONS } from './chatPreferenceTypes';

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
        <Text color='gray.textLow' type='xs'>
          Delay chat so it lines up with the video. Auto matches the measured
          stream latency.
        </Text>
      }
    >
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'timer',
          androidIcon: 'timer',
          color: theme.colorGrey,
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
