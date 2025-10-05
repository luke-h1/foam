import { Menu } from '@app/components/Menu';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export function SettingsOtherScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        items={[
          {
            label: 'About the app',
            description: 'Learn more about the app',
            onPress: () => router.push('/(settings)/about'),
          },
          {
            label: 'OSS Licenses',
            description: 'Open source software used to build this app',
            onPress: () => router.push('/(settings)/licenses'),
          },
          {
            label: 'FAQ',
            description: 'Frequently asked questions',
            onPress: () => router.push('/(settings)/faq'),
          },
          {
            label: 'ChangeLog',
            description: "What's new in the app",
            onPress: () => router.push('/(settings)/changelog'),
          },
        ]}
      />
    </SafeAreaView>
  );
}
