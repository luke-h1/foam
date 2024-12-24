import Image from '@app/components/Image';
import SettingsItem, { Content } from '@app/components/SettingsItem';
import Icon from '@app/components/ui/Icon';
import Screen from '@app/components/ui/Screen';
import { useAuthContext } from '@app/context/AuthContext';
import useAppNavigation from '@app/hooks/useAppNavigation';
import useHeader from '@app/hooks/useHeader';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useMemo, useRef } from 'react';
import { Button, ViewStyle } from 'react-native';

export default function SettingsScreen() {
  const navigation = useAppNavigation();
  useHeader({
    title: 'Settings',
    leftIcon: 'arrow-left',
    onLeftPress: () => navigation.goBack(),
  });
  const { user, logout } = useAuthContext();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '25%'], []);

  const authenticatedSettingItems: Content[] = [
    {
      id: '1',
      ctaTitle: 'Profile',
      items: [
        {
          content: user?.display_name || 'Anonymous',
          title: 'Profile',
          iconLeft: (
            <Image
              source={{ uri: user?.profile_image_url }}
              style={{ width: 30, height: 32, borderRadius: 14 }}
            />
          ),
          showRightArrow: true,
          iconRight: <Icon icon="icon-right" />,
          showSeperator: true,
          onPress: () => {
            bottomSheetModalRef.current?.present();
          },
        },
      ],
    },
  ];

  const commonSettingItems: Content[] = [
    {
      id: '2',
      ctaTitle: 'Options',
      items: [
        {
          iconLeft: <Icon icon="settings" />,
          title: 'General',
          content: 'Theme and other options',
          showRightArrow: true,
          iconRight: <Icon icon="arrow-right" />,
        },
        {
          iconLeft: <Icon icon="video" />,
          title: 'Video',
          content: 'Overlay and other options',
          showRightArrow: true,
          iconRight: <Icon icon="arrow-right" />,
        },
        {
          iconLeft: <Icon icon="layers" />,
          title: 'Chat',
          content: 'Sizing, timestamps and other options',
          showRightArrow: true,
          iconRight: <Icon icon="arrow-right" />,
          showSeperator: true,
        },
      ],
    },
    {
      id: '3',
      ctaTitle: 'Other',
      items: [
        {
          iconLeft: <Icon icon="info" />,
          title: 'About Foam',
          content: 'About the app and the developer',
        },
        {
          iconLeft: <Icon icon="link" />,
          title: 'Chanelog',
          content: 'What has changed?',
        },
        {
          iconLeft: <Icon icon="link" />,
          title: 'FAQ',
          content: 'Frequently asked questions',
        },
      ],
    },
  ];

  const unauthenticatedSettingItems: Content[] = [
    {
      id: '1',
      ctaTitle: 'Profile',
      items: [
        {
          content:
            'Log in to be able to chat, view followed streams and much more',
          title: 'Anonymous',
          iconLeft: <Icon icon="user" />,
          showRightArrow: true,
          iconRight: <Icon icon="arrow-right" />,
          showSeperator: true,
          onPress: () => {
            navigation.navigate('Login');
          },
        },
      ],
    },
  ];

  const settingItems: Content[] = [
    ...(user ? authenticatedSettingItems : unauthenticatedSettingItems),
    ...commonSettingItems,
  ];

  navigation.addListener('blur', () => {
    bottomSheetModalRef.current?.dismiss();
  });

  return (
    <Screen preset="scroll">
      <SettingsItem contents={settingItems} />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        handleStyle={{ opacity: 0.95 }}
      >
        <BottomSheetView style={$container}>
          <Icon icon="arrow-right" />
          <Button
            title="Log out"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              await logout();
              navigation.navigate('Tabs', {
                screen: 'Top',
              });
            }}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}

const $container: ViewStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8,
};
