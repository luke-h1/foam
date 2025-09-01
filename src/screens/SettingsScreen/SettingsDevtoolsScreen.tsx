import { Menu } from '@app/components/Menu';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native';

export function SettingsDevtoolsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        items={[
          {
            label: 'App Diagnostics',
            description: 'View versions, config etc.',
            onPress: () => router.push(`/dev-tools/diagnostics`),
            icon: {
              type: 'symbol',
              name: 'laptopcomputer.trianglebadge.exclamationmark',
            },
          },
          {
            label: 'Debug',
            description: 'Turn on debugging tools',
            onPress: () => router.push(`/dev-tools/debug`),
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
