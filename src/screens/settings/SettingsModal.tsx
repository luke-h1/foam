import Image from '@app/components/Image';
import SettingsItem, { ContentItem } from '@app/components/SettingsItem';
import { useAuthContext } from '@app/context/AuthContext';
import { RootRoutes, RootStackScreenProps } from '@app/navigation/RootStack';
import { colors } from '@app/styles';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  ArrowRightCircle,
  Settings,
  Video,
  User,
  Info,
  ExternalLink,
  MessageSquare,
} from '@tamagui/lucide-icons';
import { useMemo, useRef } from 'react';
import { SafeAreaView, Button } from 'react-native';
import { Stack } from 'tamagui';
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
          iconRight: <ArrowRightCircle size={20} color={colors.gray500} />,
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
          iconLeft: <Settings size={24} color={colors.gray500} />,
          title: 'General',
          content: 'Theme and other options',
          showRightArrow: true,
          iconRight: <ArrowRightCircle size={20} color={colors.gray500} />,
        },
        {
          iconLeft: <Video size={24} color={colors.gray500} />,
          title: 'Video',
          content: 'Overlay and other options',
          showRightArrow: true,
          iconRight: <ArrowRightCircle size={20} color={colors.gray500} />,
        },
        {
          iconLeft: <MessageSquare size={24} color={colors.gray500} />,
          title: 'Chat',
          content: 'Sizing, timestamps and other options',
          showRightArrow: true,
          iconRight: <ArrowRightCircle size={20} color={colors.gray500} />,
          showSeperator: true,
        },
      ],
    },
    {
      id: '3',
      ctaTitle: 'Other',
      items: [
        {
          iconLeft: <Info size={24} color={colors.gray500} />,
          title: 'About Foam',
          content: 'About the app and the developer',
        },
        {
          iconLeft: <ExternalLink size={24} color={colors.gray500} />,
          title: 'Chanelog',
          content: 'What has changed?',
        },
        {
          iconLeft: <ExternalLink size={24} color={colors.gray500} />,
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
          iconLeft: <User size={24} color={colors.gray500} />,
          showRightArrow: true,
          iconRight: <ArrowRightCircle size={20} color={colors.gray500} />,
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
        handleIndicatorStyle={{ backgroundColor: colors.gray500 }}
      >
        <Stack
          display="flex"
          flexDirection="row"
          alignItems="center"
          padding={8}
        >
          <ArrowRightCircle size={24} color="black" />
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
