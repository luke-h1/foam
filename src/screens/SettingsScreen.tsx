import {
  Button,
  Icon,
  ModalHandle,
  NavigationSectionList,
  NavigationSectionListData,
  Screen,
  SectionListItem,
  Typography,
} from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation, useHeader } from '@app/hooks';
import { BottomSheetModal, BottomSheetSectionList } from '@gorhom/bottom-sheet';
import * as Application from 'expo-application';
import { useRef } from 'react';
import { View, SafeAreaView } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';

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
  const { styles, theme } = useStyles(stylesheet);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { logout, user } = useAuthContext();
  const navigation = useAppNavigation();
  const snapPoints = ['25%', '50%'];

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
  ];

  const bottomSheetSections: NavigationSectionListData = [
    {
      title: 'Actions',
      data: [
        {
          title: 'My stream',
          description: 'View your stream',
          iconName: 'video',
          onPress: async () => {
            bottomSheetModalRef.current?.dismiss();
            navigation.navigate('Streams', {
              screen: 'LiveStream',
              params: {
                id: user?.login as string,
              },
            });
          },
        },
        {
          title: 'My Profile',
          iconName: 'user',
          description: 'View your profile',
          onPress: async () => {
            bottomSheetModalRef.current?.dismiss();
            navigation.navigate('Streams', {
              screen: 'StreamerProfile',
              params: {
                id: user?.login as string,
              },
            });
          },
        },
        {
          title: 'Blocked users',
          description: 'View blocked users',
          iconName: 'user-x',
          onPress: async () => {
            bottomSheetModalRef.current?.dismiss();
            navigation.navigate('Preferences', {
              screen: 'BlockedUsers',
            });
          },
        },
        {
          title: 'Logout',
          iconName: 'log-out',
          description: 'Log out of foam',
          onPress: async () => {
            bottomSheetModalRef.current?.dismiss();
            await logout();
            toast.info('Logged out');
            navigation.navigate('Tabs', {
              screen: 'Top',
            });
          },
        },
      ],
    },
  ];

  return (
    <Screen preset="scroll">
      <NavigationSectionList sections={sections} footer={<BuildFooter />} />
      <SafeAreaView>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          handleStyle={{ opacity: 0.95 }}
          backgroundStyle={styles.bottomSheet}
          handleComponent={ModalHandle}
        >
          <SafeAreaView style={styles.safeArea}>
            <BottomSheetSectionList
              sections={bottomSheetSections}
              keyExtractor={(item, index) => item.title + index}
              renderItem={({ item }) => (
                <Button style={styles.btn} onPress={item.onPress}>
                  <Typography style={styles.btnText}>{item.title}</Typography>
                  <Icon icon="arrow-right" />
                </Button>
              )}
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.md,
                backgroundColor: theme.colors.borderFaint,
              }}
              keyboardShouldPersistTaps="handled"
            />
          </SafeAreaView>
        </BottomSheetModal>
      </SafeAreaView>
    </Screen>
  );
}

const stylesheet = createStyleSheet(theme => ({
  safeArea: {
    flex: 1,
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
    fontWeight: 'bold',
  },
  bottomSheet: {
    backgroundColor: theme.colors.borderFaint,
  },
}));
