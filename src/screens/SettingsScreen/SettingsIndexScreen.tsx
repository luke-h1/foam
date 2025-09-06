import { Menu } from '@app/components/Menu';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';
import { SafeAreaView } from 'react-native';
import { AboutCard, BuildStatus } from './components';

export function SettingsIndexScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
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
            onPress: () => navigate('Profile'),
          },
          {
            arrow: true,
            icon: {
              name: 'drop.circle.fill',
              type: 'symbol',
            },
            label: 'Appearance',
            onPress: () => navigate('Appearance'),
          },
          {
            arrow: true,
            icon: {
              name: 'chart.bar',
              type: 'symbol',
            },
            label: 'Dev tools',
            onPress: () => navigate('DevTools'),
          },
          {
            arrow: true,
            icon: {
              name: 'opticid',
              type: 'symbol',
            },
            label: 'Other',
            onPress: () => navigate('Other'),
          },
        ]}
      />
    </SafeAreaView>
  );
}
