import { Menu } from '@app/components/Menu';
import { SettingsStackParamList } from '@app/navigators';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native';

export function SettingsOtherScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        items={[
          {
            label: 'About the app',
            description: 'Learn more about the app',
            onPress: () => router.push('/settings/other/about'),
          },
          {
            label: 'OSS Licenses',
            description: 'Open source software used to build this app',
            onPress: () => router.push('/settings/other/licenses'),
          },
          {
            label: 'FAQ',
            description: 'Frequently asked questions',
            onPress: () => router.push('/settings/other/faq'),
          },
          {
            label: 'Changelog',
            description: "What's new in the app",
            onPress: () => router.push('/settings/other/changelog'),
          },
        ]}
      />
    </SafeAreaView>
  );
}
