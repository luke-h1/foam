import {
  BuildDetails,
  Content,
  Icon,
  Screen,
  SettingsItem,
  Typography,
} from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation, useHeader } from '@app/hooks';
import { openLinkInBrowser } from '@app/utils';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import { Button, Modal, TouchableOpacity, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export function SettingsScreen() {
  const navigation = useAppNavigation();
  const { styles } = useStyles(stylesheet);
  useHeader({
    title: 'Settings',
    leftIcon: 'arrow-left',
    onLeftPress: () => navigation.goBack(),
  });
  const { user, logout } = useAuthContext();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '25%'], []);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

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
      id: '3',
      ctaTitle: 'About',
      items: [
        {
          iconLeft: <Icon icon="info" />,
          title: 'About Foam',
          content: 'About the app and the developer',
          onPress: () => {
            setModalVisible(true);
          },
        },
        {
          iconLeft: <Icon icon="link" />,
          title: 'Changelog',
          content: "What's changed?",
          onPress: () => {
            navigation.navigate('Changelog');
          },
        },
        {
          iconLeft: <Icon icon="link" />,
          title: 'FAQ',
          content: 'Frequently asked questions',
          onPress: () => {
            openLinkInBrowser('https://foam.lhowsam.com/faq');
          },
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
        <BottomSheetView style={styles.container}>
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
        <BottomSheetView style={styles.container}>
          <Icon icon="arrow-right" />
          <Button
            title="My stream"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              await logout();
              navigation.navigate('Streams', {
                screen: 'LiveStream',
                params: {
                  id: user?.login as string,
                },
              });
            }}
          />
        </BottomSheetView>
        <BottomSheetView style={styles.container}>
          <Icon icon="arrow-right" />
          <Button
            title="My Profile"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              await logout();
              navigation.navigate('Streams', {
                screen: 'StreamerProfile',
                params: {
                  id: user?.login as string,
                },
              });
            }}
          />
        </BottomSheetView>
        <BottomSheetView style={styles.container}>
          <Icon icon="arrow-right" />
          <Button
            title="Blocked"
            onPress={async () => {
              bottomSheetModalRef.current?.dismiss();
              await logout();
              navigation.navigate('Streams', {
                screen: 'StreamerProfile',
                params: {
                  id: user?.login as string,
                },
              });
            }}
          />
        </BottomSheetView>
      </BottomSheetModal>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Typography style={{ marginBottom: 2 }}>About Foam</Typography>
            <BuildDetails />
            <Typography style={{ marginBottom: 15 }}>
              &copy; {new Date().getFullYear()} Luke Howsam
            </Typography>
            <TouchableOpacity onPress={toggleModal}>
              <Typography>Close</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    alignItems: 'flex-start',
  },
}));
