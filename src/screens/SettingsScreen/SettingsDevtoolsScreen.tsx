import { Menu } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { SettingsStackParamList } from '@app/navigators/SettingsStackNavigator';
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
          null,
          {
            arrow: true,
            label: 'Cached Images',
            description: 'View & manage emote image cache',
            onPress: () => navigate('CachedImages'),
            icon: {
              type: 'symbol',
              name: 'photo.stack',
              color: theme.colors.green.accent,
            },
          },
        ]}
      />
    </Screen>
  );
}
