import { HomeTabsParamList } from '@app/navigation/Home/HomeTabs';
import twitchService, { Stream } from '@app/services/twitchService';
import theme from '@app/styles/theme';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface Props {
  stream: Stream;
}

const IMAGE_ASPECT_RATIO = 240 / 165;
const IMAGE_HEIGHT = 85;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

export default function StreamCard({ stream }: Props) {
  const [broadcasterImage, setBroadcasterImage] = useState<string>('');
  const { navigate } = useNavigation<NavigationProp<HomeTabsParamList>>();

  const getUserProfilePictures = async () => {
    const res = await twitchService.getUserProfilePicture(stream.user_login);
    setBroadcasterImage(res);
  };

  useEffect(() => {
    getUserProfilePictures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => console.log('navigate to', stream.id)}>
        <Image
          style={styles.image}
          source={{
            uri: stream.thumbnail_url
              .replace('{width}', '{320}')
              .replace('{height}', '180'),
          }}
        />
        <Text numberOfLines={1} style={styles.title}>
          {stream.title}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create<{
  title: TextStyle;
  card: ViewStyle;
  details: ViewStyle;
  image: ImageStyle;
}>({
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    shadowColor: theme.color.black,
    backgroundColor: theme.color.white,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  details: {
    padding: 14,
    justifyContent: 'center',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
});
