import {
  AntDesign,
  Entypo,
  Octicons,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import { Image, SafeAreaView, StyleSheet } from 'react-native';
import SettingsItem, { ContentItem } from '../../components/SettingsItem';
import { useAuthContext } from '../../context/AuthContext';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';
import colors from '../../styles/colors';
import { statusBarHeight } from '../FollowingScreen';

const SettingsModal = ({
  navigation,
}: RootStackScreenProps<RootRoutes.SettingsModal>) => {
  const { user } = useAuthContext();

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
              style={{ width: 30, height: 30, borderRadius: 8 }}
            />
          ),
          showRightArrow: true,
          iconRight: <AntDesign name="right" size={16} color={colors.gray} />,
          showSeperator: true,
          onPress: () => {
            // eslint-disable-next-line no-console
            console.log('show modal here');
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
          onPress: () => navigation.navigate(RootRoutes.Login),
        },
      ],
    },
  ];

  const settingItems: ContentItem[] = [
    ...(user ? authenticatedSettingItems : unauthenticatedSettingItems),
    ...commonSettingItems,
  ];

  return (
    <SafeAreaView style={styles.wrapper}>
      <SettingsItem contents={settingItems} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  copy: {
    marginLeft: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    textAlign: 'left',
    width: '85%',
    textAlignVertical: 'center',
    flexWrap: 'wrap',
  },
  settingsItem: {
    display: 'flex',
    alignContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapper: {
    backgroundColor: colors.primary,
    flex: 1,
    paddingTop: statusBarHeight,
  },
});

export default SettingsModal;