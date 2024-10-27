import Image from '@app/components/Image';
import SafeAreaContainer from '@app/components/SafeAreaContainer';
import SettingsItem, { ContentItem } from '@app/components/SettingsItem';
import Text from '@app/components/Text';
import { useAuthContext } from '@app/context/AuthContext';
import {
  SettingsRoutes,
  SettingsStackScreenProps,
} from '@app/navigation/Settings/SettingsStack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMemo, useRef } from 'react';
import { Button, StyleSheet, View, ViewStyle } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

export default function SettingsScreen({
  navigation,
}: SettingsStackScreenProps<SettingsRoutes.Settings>) {
  const { user, logout } = useAuthContext();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '25%'], []);

  const ICON_LEFT_SIZE = 22;
  const ICON_RIGHT_SIZE = 20;

  const authenticatedSettingItems: ContentItem[] = [
    {
      id: '1',
      ctaTitle: 'Profile',
      items: [
        {
          content: user?.display_name ?? 'Anonymous',
          title: 'Profile',
          iconLeft: (
            <Image
              source={{ uri: user?.profile_image_url }}
              style={{ width: 30, height: 32, borderRadius: 14 }}
            />
          ),
          showRightArrow: true,
          iconRight: <Feather size={ICON_RIGHT_SIZE} name="icon-right" />,
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
          iconLeft: <Feather size={ICON_LEFT_SIZE} name="settings" />,
          title: 'General',
          content: 'Theme and other options',
          showRightArrow: true,
          iconRight: <Feather size={ICON_RIGHT_SIZE} name="arrow-right" />,
        },
        {
          iconLeft: <Feather size={ICON_LEFT_SIZE} name="video" />,
          title: 'Video',
          content: 'Overlay and other options',
          showRightArrow: true,
          iconRight: <Feather size={ICON_RIGHT_SIZE} name="arrow-right" />,
        },
        {
          iconLeft: <Feather size={ICON_LEFT_SIZE} name="layers" />,
          title: 'Chat',
          content: 'Sizing, timestamps and other options',
          showRightArrow: true,
          iconRight: <Feather size={ICON_RIGHT_SIZE} name="arrow-right" />,
          showSeperator: true,
        },
      ],
    },
    {
      id: '3',
      ctaTitle: 'Other',
      items: [
        {
          iconLeft: <Feather size={ICON_LEFT_SIZE} name="info" />,
          title: 'About Foam',
          content: 'About the app and the developer',
        },
        {
          iconLeft: <Feather size={ICON_LEFT_SIZE} name="link" />,
          title: 'Chanelog',
          content: 'What has changed?',
        },
        {
          iconLeft: <Feather size={ICON_LEFT_SIZE} name="link" />,
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
          iconLeft: <Feather size={ICON_LEFT_SIZE} name="user" />,
          showRightArrow: true,
          iconRight: <Feather size={ICON_RIGHT_SIZE} name="arrow-right" />,
          showSeperator: true,
          onPress: () => {
            navigation.navigate(SettingsRoutes.Login);
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
    <SafeAreaContainer>
      <Text
        size="md"
        style={{
          padding: 6,
        }}
      >
        Settings
      </Text>
      <SettingsItem contents={settingItems} />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        handleStyle={{ opacity: 0.95 }}
        // backgroundStyle={{ backgroundColor: colors.gray900 }}
        // handleIndicatorStyle={{ backgroundColor: colors.gray400 }}
      >
        <View style={styles.container}>
          <Feather size={ICON_LEFT_SIZE} color="$color" name="arrow-right" />
          <Button
            title="Log out"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              await logout();
              navigation.navigate(SettingsRoutes.Settings);
            }}
          />
        </View>
        {/* <View style={styles.container}>
          <Feather size={ICON_LEFT_SIZE} color="$color" name="arrow-right" />
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
        </View> */}
      </BottomSheetModal>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
}>({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
});
