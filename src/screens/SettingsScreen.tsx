import {
  NavigationSectionList,
  NavigationSectionListData,
  Screen,
  SectionListItem,
  Typography,
} from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation, useHeader } from '@app/hooks';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Application from 'expo-application';
import { useRef } from 'react';
import { View } from 'react-native';
import { UserModal } from './SettingsScreen/components';

const BuildFooter = () => (
  <View style={{ marginBottom: 12 }}>
    <Typography color="border">
      Version: {Application.nativeApplicationVersion ?? ''} (
      {Application.nativeBuildVersion ?? ''})
    </Typography>
  </View>
);

export function SettingsScreen() {
  const { navigate, goBack, addListener } = useAppNavigation();

  useHeader({
    title: 'Settings',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });
  const { user } = useAuthContext();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  addListener('blur', () => {
    bottomSheetModalRef.current?.dismiss();
  });

  const authenticatedLists: SectionListItem[] = [
    {
      title: user?.display_name as string,
      description: 'Profile',
      picture: user?.profile_image_url,
      onPress: () => bottomSheetModalRef.current?.present(),
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
          description: 'Analytics settings, feature flags',
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
      ],
    },
  ];

  return (
    <Screen preset="scroll">
      <NavigationSectionList sections={sections} footer={<BuildFooter />} />
      <UserModal ref={bottomSheetModalRef} />
    </Screen>
  );
}
