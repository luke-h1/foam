import { Menu } from '@app/components/Menu';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { SettingsStackParamList } from '@app/navigators/SettingsStackNavigator';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useUnistyles } from 'react-native-unistyles';

export function SettingsOtherScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <Menu
        header={
          <ScreenHeader
            title="Other"
            subtitle="Privacy, licenses & more"
            size="medium"
          />
        }
        items={[
          {
            arrow: true,
            label: 'About the app',
            description: 'Learn more about the app',
            onPress: () => navigate('About'),
            icon: {
              type: 'symbol',
              name: 'info.circle',
              color: theme.colors.blue.accent,
            },
          },
          null,
          {
            arrow: true,
            label: 'OSS Licenses',
            description: 'Open source software used',
            onPress: () => navigate('Licenses'),
            icon: {
              type: 'symbol',
              name: 'doc.text',
              color: theme.colors.green.accent,
            },
          },
          null,
          {
            arrow: true,
            label: 'FAQ',
            description: 'Frequently asked questions',
            onPress: () => navigate('Faq'),
            icon: {
              type: 'symbol',
              name: 'questionmark.circle',
              color: theme.colors.violet.accent,
            },
          },
          null,
          {
            arrow: true,
            label: 'ChangeLog',
            description: "What's new in the app",
            onPress: () => navigate('Changelog'),
            icon: {
              type: 'symbol',
              name: 'sparkles',
              color: theme.colors.amber.accent,
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
