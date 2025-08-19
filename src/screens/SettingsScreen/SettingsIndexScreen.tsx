import { Item, Menu } from '@app/components/Menu';
import { useAuthContext } from '@app/context';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';
import { SafeAreaView } from 'react-native';

export function SettingsIndexScreen() {
  const { authState } = useAuthContext();
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
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
              name: 'chart.line.text.clipboard',
              type: 'symbol',
            },
            label: 'Dev tools',
            onPress: () => navigate('DevTools'),
          },
          {
            arrow: true,
            icon: {
              name: 'widget.extralarge.badge.plus',
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
