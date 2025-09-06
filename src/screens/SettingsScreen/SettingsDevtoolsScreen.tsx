import { Menu } from '@app/components/Menu';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';
import { SafeAreaView } from 'react-native';

export function SettingsDevtoolsScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        items={[
          {
            label: 'App Diagnostics',
            description: 'View versions, config etc.',
            onPress: () => navigate('Diagnostics'),
            icon: {
              type: 'symbol',
              name: 'laptopcomputer.trianglebadge.exclamationmark',
            },
          },
          {
            label: 'Debug',
            description: 'Turn on debugging tools',
            onPress: () => navigate('Debug'),
            icon: {
              type: 'symbol',
              name: 'laptopcomputer.trianglebadge.exclamationmark',
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}
