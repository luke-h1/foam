import { Menu } from '@app/components/Menu';
import { SafeAreaView } from 'react-native';

export function SettingsAppearanceScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        items={[
          'Appearance',
          {
            icon: {
              name: 'scribble.variable',
              type: 'symbol',
            },
            label: 'Theme',
            value: 'dark',
          },
          null,
          'Fonts',
          {
            key: 'font',
            options: [],
            value: '',
            label: 'Fonts',
          },
          {
            key: 'systemScaling',
            label: 'System Scaling',
            value: false,
          },
          {
            label: 'FontScaling',
            key: 'fontScaling',
            value: 1,
          },
        ]}
      />
    </SafeAreaView>
  );
}
