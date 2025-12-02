import { ScreenHeader } from '@app/components';
import { Menu } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';
import { useUnistyles } from 'react-native-unistyles';

export function SettingsDevtoolsScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  const { theme } = useUnistyles();

  return (
    <Screen safeAreaEdges={[]} preset="fixed">
      <Menu
        header={
          <ScreenHeader
            title="Dev Tools"
            subtitle="Debug options & diagnostics"
            size="medium"
          />
        }
        items={[
          {
            arrow: true,
            label: 'App Diagnostics',
            description: 'View versions, config etc.',
            onPress: () => navigate('Diagnostics'),
            icon: {
              type: 'symbol',
              name: 'stethoscope',
              color: theme.colors.blue.accent,
            },
          },
          null,
          {
            arrow: true,
            label: 'Debug',
            description: 'Turn on debugging tools',
            onPress: () => navigate('Debug'),
            icon: {
              type: 'symbol',
              name: 'ant',
              color: theme.colors.orange.accent,
            },
          },
        ]}
      />
    </Screen>
  );
}
