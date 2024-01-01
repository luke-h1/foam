import {
  AntDesign,
  Entypo,
  Octicons,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMemo, useRef } from 'react';
import { SafeAreaView, Button } from 'react-native';
import { Stack } from 'tamagui';
import Image from '../../components/Image';
import SettingsItem, { ContentItem } from '../../components/SettingsItem';
import { useAuthContext } from '../../context/AuthContext';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';
import colors from '../../styles/colors';
import { statusBarHeight } from '../FollowingScreen';

const SettingsModal = ({
  navigation,
}: RootStackScreenProps<RootRoutes.SettingsModal>) => {
  const { user, logout } = useAuthContext();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '25%'], []);

  const authenticatedSettingItems: ContentItem[] = [
    {
      id: '1',
      ctaTitle: 'Profile',
      items: [
        {
          content: user?.display_name as string,
          title: 'Profile',
          iconLeft: (
            <Image
              source={{ uri: user?.profile_image_url }}
              style={{ width: 30, height: 32, borderRadius: 145 }}
            />
          ),
          showRightArrow: true,
          iconRight: <AntDesign name="right" size={16} color={colors.black} />,
          showSeperator: true,
          onPress: () => {
            bottomSheetModalRef.current?.present();
          },
        },
      ],
    },
  ];

  const commonSettingItems: ContentItem[] = [
    {
      id: '2',
      ctaTitle: 'Options',
      items: [
        {
          iconLeft: <Entypo name="cog" size={24} color={colors.gray} />,
          title: 'General',
          content: 'Theme and other options',
          showRightArrow: true,
          iconRight: <AntDesign name="right" size={24} color={colors.gray} />,
        },
        {
          iconLeft: <Octicons name="video" size={24} color={colors.gray} />,
          title: 'Video',
          content: 'Overlay and other options',
          showRightArrow: true,
          iconRight: <AntDesign name="right" size={24} color={colors.gray} />,
        },
        {
          iconLeft: (
            <MaterialIcons
              name="chat-bubble-outline"
              size={24}
              color={colors.gray}
            />
          ),
          title: 'Chat',
          content: 'Sizing, timestamps and other options',
          showRightArrow: true,
          iconRight: <AntDesign name="right" size={24} color={colors.gray} />,
          showSeperator: true,
        },
      ],
    },
    {
      id: '3',
      ctaTitle: 'Other',
      items: [
        {
          iconLeft: <Octicons name="info" size={24} color={colors.gray} />,
          title: 'About Foam',
          content: 'About the app and the developer',
        },
        {
          iconLeft: (
            <Feather name="external-link" size={24} color={colors.gray} />
          ),
          title: 'Chanelog',
          content: 'What has changed?',
        },
        {
          iconLeft: (
            <Feather name="external-link" size={24} color={colors.gray} />
          ),
          title: 'FAQ',
          content: 'Frequently asked questions',
        },
      ],
    },
  ];

  const unauthenticatedSettingItems: ContentItem[] = [
    {
      id: '1',
      ctaTitle: 'Profile',
      items: [
        {
          content:
            'Log in to be able to chat, view followed streams and much more :)',
          title: 'Anonymous',
          iconLeft: <AntDesign name="user" size={24} color={colors.gray} />,
          showRightArrow: true,
          iconRight: <AntDesign name="right" size={16} color={colors.gray} />,
          showSeperator: true,
          onPress: () => {
            navigation.navigate(RootRoutes.Login);
          },
        },
      ],
    },
  ];

  const settingItems: ContentItem[] = [
    ...(user ? authenticatedSettingItems : unauthenticatedSettingItems),
    ...commonSettingItems,
  ];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: statusBarHeight,
      }}
    >
      <SettingsItem contents={settingItems} />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        handleStyle={{ opacity: 0.95 }}
        handleIndicatorStyle={{ backgroundColor: colors.gray }}
      >
        <Stack
          display="flex"
          flexDirection="row"
          alignItems="center"
          padding={8}
        >
          <Feather name="arrow-right-circle" size={24} color="black" />
          <Button
            title="Log out"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              await logout();
              navigation.navigate(RootRoutes.Home);
            }}
          />
        </Stack>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

export default SettingsModal;
