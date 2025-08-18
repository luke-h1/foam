import { Menu } from '@app/components/Menu';

export function SettingsScreenv2() {
  return (
    <Menu
      items={[
        {
          arrow: true,
          icon: {
            name: 'gear',
            type: 'symbol',
          },
          label: 'Profile',
          onPress: () => {},
        },
      ]}
    />
  );
}
