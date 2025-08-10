import {
  BodyScrollView,
  Button,
  Icon,
  NavigationSectionList,
  NavigationSectionListData,
  SafeAreaViewFixed,
  SectionListItem,
  Text,
} from '@app/components';
import { Menu, MenuItem } from '@app/components/Menu';
import { useAuthContext } from '@app/context';
import { useAppNavigation } from '@app/hooks';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';

const BuildFooter = () => {
  return (
    <View style={styles.buildContainer}>
      <Text color="text" variant="caption2">
        v:{Application.nativeApplicationVersion ?? ''} (
        {Application.nativeBuildVersion ?? ''})
      </Text>
      <Text variant="caption2">
        OTA: {Updates.runtimeVersion} (
        {(Updates.createdAt ?? new Date()).toLocaleString('en-US', {
          timeZoneName: 'short',
        })}
        )
      </Text>
    </View>
  );
};

export function SettingsScreen() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { navigate, addListener } = useAppNavigation();

  const { theme } = useUnistyles();

  const { logout, user } = useAuthContext();
  const navigation = useAppNavigation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const profileMenuItems: MenuItem[] = [
    {
      label: 'My stream',
      description: 'View your stream',
      icon: { type: 'icon', name: 'video' },
      arrow: true,
      onPress: () => {
        setShowProfileMenu(false);
        navigation.navigate('Streams', {
          screen: 'LiveStream',
          params: {
            id: user?.login as string,
          },
        });
      },
    },
    {
      label: 'My Profile',
      description: 'View your profile',
      icon: { type: 'icon', name: 'user' },
      arrow: true,
      onPress: () => {
        setShowProfileMenu(false);
        navigation.navigate('Streams', {
          screen: 'StreamerProfile',
          params: {
            id: user?.login as string,
          },
        });
      },
    },
    {
      label: 'Blocked users',
      description: 'View blocked users',
      icon: { type: 'icon', name: 'user-x' },
      arrow: true,
      onPress: () => {
        setShowProfileMenu(false);
        navigation.navigate('Preferences', {
          screen: 'BlockedUsers',
        });
      },
    },
    {
      label: 'Logout',
      description: 'Log out of foam',
      icon: { type: 'icon', name: 'log-out' },
      arrow: true,
      onPress: () => {
        setShowProfileMenu(false);
        void logout();
        toast.info('Logged out');
        navigation.navigate('Tabs', {
          screen: 'Top',
        });
      },
    },
  ];

  const authenticatedLists: SectionListItem[] = [
    {
      title: user?.display_name as string,
      description: 'Profile',
      picture: user?.profile_image_url,
      onPress: () => setShowProfileMenu(true),
    },
    {
      title: 'My Channel',
      description: 'View your channel',
      iconName: 'user',
      onPress: () =>
        navigate('Streams', {
          screen: 'StreamerProfile',
          params: {
            id: user?.id as string,
          },
        }),
    },
    {
      title: 'Blocked Users',
      description: 'Managed blocked users',
      iconName: 'bell-off',
      onPress: () =>
        navigate('Preferences', {
          screen: 'BlockedUsers',
        }),
    },
  ];

  const sections: NavigationSectionListData = [
    {
      title: 'Profile',
      data: user?.login
        ? authenticatedLists
        : [
            {
              title: 'Anonymous',
              description:
                'Login to be able to chat, view followed streamers and much more',
              iconName: 'user',
              onPress: () => navigate('Login'),
            },
          ],
    },
    {
      title: 'Preferences',
      data: [
        {
          title: 'Theme',
          description: 'Customize certain theming options',
          iconName: 'settings',
          onPress: () =>
            navigate('Preferences', {
              screen: 'Theming',
            }),
        },
        {
          title: 'Chat',
          description: 'Customize your chat experience',
          iconName: 'message-square',
          onPress: () =>
            navigate('Preferences', {
              screen: 'Chat',
            }),
        },
        {
          title: 'Video',
          description: 'Customize video preferences',
          iconName: 'maximize',
          onPress: () =>
            navigate('Preferences', {
              screen: 'Video',
            }),
        },
      ],
    },
    {
      title: 'Dev Tools',
      data: [
        {
          title: 'App diagnostics',
          iconName: '',
          description: 'View versions, config etc.',
          onPress: () =>
            navigate('DevTools', {
              screen: 'Diagnostics',
            }),
        },
        {
          title: 'New Relic Demo',
          iconName: '',
          description: 'Demo new relic instrumentation screen',
          onPress: () =>
            navigate('DevTools', {
              screen: 'NewRelicDemo',
            }),
        },
        {
          title: 'Debug',
          iconName: '',
          description: 'Turn on debug tools',
          onPress: () => navigate('DevTools', { screen: 'Debug' }),
        },
      ],
    },
    {
      title: 'Other',
      data: [
        {
          title: 'About the app',
          iconName: '',
          description: 'Learn more about the app',
          onPress: () => navigate('Other', { screen: 'About' }),
        },
        {
          title: 'Open Source Licenses',
          iconName: '',
          description: 'Licenses',
          onPress: () => navigate('Other', { screen: 'Licenses' }),
        },

        {
          title: 'Changelog',
          description: 'release notes',
          iconName: '',
          onPress: () => navigate('Other', { screen: 'Changelog' }),
        },
        {
          title: 'FAQ',
          description: 'Questions and answers',
          iconName: '',
          onPress: () => navigate('Other', { screen: 'Faq' }),
        },
      ],
    },
  ];

  if (showProfileMenu) {
    return (
      <SafeAreaViewFixed style={styles.safeArea}>
        <View style={styles.menuHeader}>
          <Button onPress={() => setShowProfileMenu(false)}>
            <Icon name="ArrowLeft" />
            <Text>Back</Text>
          </Button>
          <Text weight="bold" size="lg">
            Profile Actions
          </Text>
        </View>
        <Menu items={profileMenuItems} />
      </SafeAreaViewFixed>
    );
  }

  return (
    <BodyScrollView>
      <NavigationSectionList sections={sections} footer={<BuildFooter />} />
    </BodyScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  safeArea: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderFaint,
    gap: theme.spacing.sm,
  },
  container: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  btnText: {
    flex: 1,
  },
  sectionHeader: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  bottomSheet: {
    backgroundColor: theme.colors.borderFaint,
  },
  buildContainer: {
    borderTopColor: theme.colors.borderFaint,
    borderTopWidth: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
}));
