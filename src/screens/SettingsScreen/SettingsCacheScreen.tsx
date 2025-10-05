import { Menu } from '@app/components/Menu';
import { useUnistyles } from 'react-native-unistyles';

export function SettingsCacheScreen() {
  const { theme } = useUnistyles();

  return (
    <Menu
      items={[
        {
          description: 'Refetch all data',
          label: 'Clear data',
          icon: {
            color: theme.colors.red.accent,
            name: 'externaldrive.badge.exclamationmark',
            type: 'symbol',
          },
        },
        {
          description:
            'Will hard-refetch all emotes, badges etc. and remove old entries from device cache',
          title: 'Clear Image cache',
          label: 'Clears all emote/badge image cache',
          icon: {
            color: theme.colors.red.accent,
            name: 'externaldrive.connected.to.line.below.fill',
            type: 'symbol',
          },
        },
      ]}
    />
  );
}
