import { RootStackParamList, RootRoutes } from '@app/navigation/RootStack';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import twitchService, { Stream } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { radii } from '@app/styles/radii';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Image, ImageStyle } from 'expo-image';
import { useState, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import LiveStreamImage from './LiveStreamImage';
import Tags from './Tags';
import { Text } from './ui/Text';

interface Props {
  stream: Stream;
}

export default function LiveStreamCard({ stream }: Props) {
  const [broadcasterImage, setBroadcasterImage] = useState<string>();

  const { navigate } = useNavigation<NavigationProp<RootStackParamList>>();

  const getUserProfilePictures = async () => {
    const res = await twitchService.getUserImage(stream.user_login);
    setBroadcasterImage(res);
  };

  useEffect(() => {
    getUserProfilePictures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <TouchableOpacity
      onPress={() => {
        navigate(RootRoutes.Stream, {
          screen: StreamRoutes.LiveStream,
          params: {
            id: stream.user_login,
          },
        });
      }}
    >
      <Text
      // style={[styles.streamCard]}
      // dark="rgba(255,255,255,0.15)"
      // light={colors.textDim}
      >
        <View style={styles.streamHeadline}>
          <LiveStreamImage
            animated
            thumbnail={stream.thumbnail_url}
            startedAt={stream.started_at}
            size="large"
          />
          <View style={styles.streamDetail}>
            <Text>{stream.title}</Text>
            <View style={styles.streamMetadata}>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: broadcasterImage }}
                  style={styles.avatar}
                  testID="LiveStreamCard-avatar"
                />
                <Text>{stream.user_name}</Text>
              </View>
              <Text>
                {new Intl.NumberFormat('en-US').format(stream.viewer_count)}{' '}
                viewers
              </Text>
            </View>
          </View>
        </View>
      </Text>

      <View style={{ marginTop: spacing.extraSmall }}>
        <Tags tags={stream.tags} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create<{
  streamCard: ViewStyle;
  streamHeadline: ViewStyle;
  streamDetail: ViewStyle;
  streamMetadata: ViewStyle;
  userInfo: ViewStyle;
  avatar: ImageStyle;
}>({
  streamCard: {
    flex: 1,
    padding: spacing.extraSmall,
    marginHorizontal: spacing.small,
    borderRadius: radii.sm,
    marginBottom: spacing.medium,
  },
  streamDetail: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  streamHeadline: {
    flex: 1,
    flexDirection: 'row',
  },
  streamMetadata: {
    marginTop: spacing.medium,
    flex: 1,
    flexDirection: 'column',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 13,
    marginRight: 5,
  },
});
