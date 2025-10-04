import { Menu } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';

export function SettingsDevtoolsScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();

  return (
    <Screen safeAreaEdges={['top']} preset="fixed">
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
    </Screen>
  );
}
