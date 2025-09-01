import { Menu } from '@app/components/Menu';
import { AboutCard, BuildStatus } from '@app/screens/SettingsScreen/components';
import { useAuthContext } from '@app/context';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native';

export default function SettingsIndexScreen() {
  const router = useRouter();
  const { authState } = useAuthContext();
  
  const isAuthenticated = authState?.isLoggedIn && !authState?.isAnonAuth;

  const menuItems = [
    // Profile settings - only for authenticated users
    ...(isAuthenticated
      ? [
          {
            arrow: true,
            icon: {
              name: 'person.circle',
              type: 'symbol' as const,
            },
            label: 'Profile',
            onPress: () => router.push('/settings/profile'),
          },
        ]
      : []),
    
    {
      arrow: true,
      icon: {
        name: 'drop.circle.fill',
        type: 'symbol' as const,
      },
      label: 'Appearance',
      onPress: () => router.push('/settings/apperance'),
    },
    
    {
      arrow: true,
      icon: {
        name: 'chart.bar',
        type: 'symbol' as const,
      },
      label: 'Dev tools',
      onPress: () => router.push('/dev-tools'),
    },
    
    {
      arrow: true,
      icon: {
        name: 'opticid',
        type: 'symbol' as const,
      },
      label: 'Other',
      onPress: () => router.push('/settings/other'),
    },

    // Authentication options
    ...(isAuthenticated
      ? [
          {
            arrow: false,
            icon: {
              name: 'rectangle.portrait.and.arrow.right',
              type: 'symbol' as const,
            },
            label: 'Sign Out',
            onPress: () => {
              // Handle logout
              // This should be implemented in your auth context
            },
          },
        ]
      : [
          {
            arrow: false,
            icon: {
              name: 'rectangle.portrait.and.arrow.right',
              type: 'symbol' as const,
            },
            label: 'Sign In with Twitch',
            onPress: () => router.push('/auth'),
          },
        ]),
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        header={<AboutCard />}
        footer={<BuildStatus />}
        items={menuItems}
      />
    </SafeAreaView>
  );
}
