import { Menu } from '@app/components/Menu';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AboutCard, BuildStatus } from './components';

export function SettingsIndexScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        header={<AboutCard />}
        footer={<BuildStatus />}
        items={[
          {
            arrow: true,
            icon: {
              name: 'gear',
              type: 'symbol',
            },
            label: 'Profile',
            onPress: () => router.push('/(settings)/profile'),
          },
          {
            arrow: true,
            icon: {
              name: 'drop.circle.fill',
              type: 'symbol',
            },
            label: 'Appearance',
            onPress: () => router.push('/(settings)/appearance'),
          },
          {
            arrow: true,
            icon: {
              name: 'chart.bar',
              type: 'symbol',
            },
            label: 'Dev tools',
            onPress: () => router.push('/dev-tools'),
          },
          {
            arrow: true,
            icon: {
              name: 'opticid',
              type: 'symbol',
            },
            label: 'Other',
            onPress: () => router.push('/(settings)/other'),
          },
        ]}
      />
    </SafeAreaView>
  );
}
