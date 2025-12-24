import { Menu, MenuItem } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { usePreferences } from '@app/store/preferenceStore';
import { useUnistyles } from 'react-native-unistyles';

export function ChatPreferenceScreen() {
  const { chatTimestamps, update } = usePreferences();
  const { theme } = useUnistyles();

  const items: (MenuItem | string | null)[] = [
    'Messages',
    {
      icon: {
        name: 'clock',
        type: 'symbol',
        color: theme.colors.blue.accent,
      },
      label: 'Show Timestamps',
      description: 'Display time next to messages',
      onSelect: (value: boolean) => {
        update({ chatTimestamps: value });
      },
      type: 'switch',
      value: chatTimestamps,
    },
  ];

  return (
    <Screen safeAreaEdges={[]} preset="fixed">
      <Menu
        header={
          <ScreenHeader
            title="Chat"
            subtitle="Message display options"
            size="medium"
          />
        }
        items={items}
      />
    </Screen>
  );
}
