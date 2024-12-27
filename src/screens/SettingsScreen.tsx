import BuildDetails from '@app/components/BuildDetails';
import Image from '@app/components/Image';
import SettingsItem, { Content } from '@app/components/SettingsItem';
import Icon from '@app/components/ui/Icon';
import Screen from '@app/components/ui/Screen';
import { Text } from '@app/components/ui/Text';
import { useAuthContext } from '@app/context/AuthContext';
import useAppNavigation from '@app/hooks/useAppNavigation';
import useHeader from '@app/hooks/useHeader';
import { colors } from '@app/styles';
import { openLinkInBrowser } from '@app/utils/openLinkInBrowser';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useMemo, useRef, useState } from 'react';
import { Button, Modal, TouchableOpacity, View, ViewStyle } from 'react-native';

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
    // {
    //   id: '2',
    //   ctaTitle: 'Options',
    //   items: [
    //     {
    //       iconLeft: <Icon icon="settings" />,
    //       title: 'General',
    //       content: 'Theme and other options',
    //       showRightArrow: true,
    //       iconRight: <Icon icon="arrow-right" />,
    //     },
    //     {
    //       iconLeft: <Icon icon="video" />,
    //       title: 'Video',
    //       content: 'Overlay and other options',
    //       showRightArrow: true,
    //       iconRight: <Icon icon="arrow-right" />,
    //     },
    //     {
    //       iconLeft: <Icon icon="layers" />,
    //       title: 'Chat',
    //       content: 'Sizing, timestamps and other options',
    //       showRightArrow: true,
    //       iconRight: <Icon icon="arrow-right" />,
    //       showSeperator: true,
    //     },
    //   ],
    // },
    {
      id: '3',
      ctaTitle: 'About',
      items: [
        {
          iconLeft: <Icon icon="info" />,
          title: 'About Foam',
          content: 'About the app and the developer',
          onPress: () => {
            // open modal
            setModalVisible(true);
          },
        },
        {
          iconLeft: <Icon icon="link" />,
          title: 'Chanelog',
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
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={toggleModal}
      >
        <View style={$modalContainer}>
          <View style={$modalContent}>
            <Text preset="cardFooterHeading" style={{ marginBottom: 2 }}>
              About Foam
            </Text>
            <BuildDetails />
            <Text style={{ marginBottom: 15 }}>
              &copy; {new Date().getFullYear()} Luke Howsam
            </Text>
            <TouchableOpacity onPress={toggleModal}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const $container: ViewStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8,
};

const $modalContainer: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
};

const $modalContent: ViewStyle = {
  width: 300,
  padding: 20,
  backgroundColor: colors.tint,
  borderRadius: 10,
};
