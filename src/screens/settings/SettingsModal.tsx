/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  AntDesign,
  Entypo,
  Octicons,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import { SafeAreaView, StyleSheet } from 'react-native';
import Header from '../../components/Header';
import SettingsItem, { ContentItem } from '../../components/SettingsItem';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';
import colors from '../../styles/colors';
import { statusBarHeight } from '../FollowingScreen';

const SettingsModal = ({
  navigation,
}: RootStackScreenProps<RootRoutes.SettingsModal>) => {
  const settingItems: ContentItem[] = [
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

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* @ts-ignore */}
      <Header title="Settings" showAvatar={false} navigation={navigation} />
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
