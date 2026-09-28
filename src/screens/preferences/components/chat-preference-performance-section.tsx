import { SettingsSection } from '@app/components/settings-section/settings-section';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

import { SCROLLBACK_LABELS } from '../util/chat-preference-types';
import { ChatPreferenceSegmentedSettingsRow } from './chat-preference-settings-rows';

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
