import { Menu } from '@app/components/Menu';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';
import { SafeAreaView } from 'react-native';

export function SettingsOtherScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        items={[
          {
            label: 'About the app',
            description: 'Learn more about the app',
            onPress: () => navigate('About'),
          },
          {
            label: 'OSS Licenses',
            description: 'Open source software used to build this app',
            onPress: () => navigate('Licenses'),
          },
          {
            label: 'FAQ',
            description: 'Frequently asked questions',
            onPress: () => navigate('Faq'),
          },
          {
            label: 'ChangeLog',
            description: "What's new in the app",
            onPress: () => navigate('Changelog'),
          },
        ]}
      />
    </SafeAreaView>
  );
}
