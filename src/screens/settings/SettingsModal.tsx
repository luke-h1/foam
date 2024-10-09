import Image from '@app/components/Image';
import SettingsItem, { ContentItem } from '@app/components/SettingsItem';
import { useAuthContext } from '@app/context/AuthContext';
import { RootRoutes, RootStackScreenProps } from '@app/navigation/RootStack';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMemo, useRef } from 'react';
import { Button, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

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
              style={{ width: 30, height: 32, borderRadius: 14 }}
            />
          ),
          showRightArrow: true,
          iconRight: <Feather size={20} name="icon-right" />,
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
          iconLeft: <Feather size={24} name="settings" />,
          title: 'General',
          content: 'Theme and other options',
          showRightArrow: true,
          iconRight: <Feather size={20} name="arrow-right" />,
        },
        {
          iconLeft: <Feather size={24} name="video" />,
          title: 'Video',
          content: 'Overlay and other options',
          showRightArrow: true,
          iconRight: <Feather size={20} name="arrow-right" />,
        },
        {
          iconLeft: <Feather size={24} name="message" />,
          title: 'Chat',
          content: 'Sizing, timestamps and other options',
          showRightArrow: true,
          iconRight: <Feather size={20} name="arrow-right" />,
          showSeperator: true,
        },
      ],
    },
    {
      id: '3',
      ctaTitle: 'Other',
      items: [
        {
          iconLeft: <Feather size={24} name="info" />,
          title: 'About Foam',
          content: 'About the app and the developer',
        },
        {
          iconLeft: <Feather size={24} name="link" />,
          title: 'Chanelog',
          content: 'What has changed?',
        },
        {
          iconLeft: <Feather size={24} name="link" />,
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
          iconLeft: <Feather size={24} name="user" />,
          showRightArrow: true,
          iconRight: <Feather size={20} name="arrow-right" />,
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

  navigation.addListener('blur', () => {
    bottomSheetModalRef.current?.dismiss();
  });

  return (
    <View>
      <SettingsItem contents={settingItems} />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        handleStyle={{ opacity: 0.95 }}
        // backgroundStyle={{ backgroundColor: colors.gray900 }}
        // handleIndicatorStyle={{ backgroundColor: colors.gray400 }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
          }}
        >
          <Feather size={24} color="$color" name="arrow-right" />
          <Button
            title="Log out"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              await logout();
              navigation.navigate(RootRoutes.Home);
            }}
          />
        </View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
          }}
        >
          <Feather size={24} color="$color" name="arrow-right" />
          <Button
            title="My stream"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              navigation.navigate(StreamRoutes.LiveStream, {
                screen: StreamRoutes.LiveStream,
                params: {
                  id: user?.login,
                },
              });
            }}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
};

export default SettingsModal;
