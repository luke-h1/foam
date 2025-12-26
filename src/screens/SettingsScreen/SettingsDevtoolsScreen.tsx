import { Menu } from '@app/components/Menu';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { SettingsStackParamList } from '@app/navigators/SettingsStackNavigator';
import { View } from 'react-native';
import { StyleSheet , useUnistyles } from 'react-native-unistyles';

export function SettingsDevtoolsScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
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
          null,
          {
            arrow: true,
            label: 'Storybook',
            description: 'UI preview',
            onPress: () => navigate('Storybook'),
            icon: {
              type: 'symbol',
              name: 'book.closed',
              color: theme.colors.green.accent,
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
}));
