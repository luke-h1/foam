import { Menu } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';

export function SettingsOtherScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  return (
    <Screen safeAreaEdges={['top']} preset="fixed">
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
    </Screen>
  );
}
