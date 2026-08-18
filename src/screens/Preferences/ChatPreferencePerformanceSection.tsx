import { SettingsSection } from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import { SCROLLBACK_LABELS } from './chatPreferenceTypes';

export function ChatPreferencePerformanceSection({
  handleScrollbackChange,
  scrollbackIndex,
}: {
  handleScrollbackChange: (index: number) => void;
  scrollbackIndex: number;
}) {
  return (
    <SettingsSection
      title='Performance'
      footer={
        <Text color='gray.textLow' type='xs'>
          Longer scrollback keeps more messages in memory; 200 is easier on
          older devices.
        </Text>
      }
    >
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'text.line.last.and.arrowtriangle.forward',
          androidIcon: 'sort',
          color: theme.colorGrey,
        }}
        onSelectIndex={handleScrollbackChange}
        selectedIndex={scrollbackIndex}
        subtitle='Messages kept in chat history'
        title='Scrollback'
        values={SCROLLBACK_LABELS}
      />
    </SettingsSection>
  );
}
