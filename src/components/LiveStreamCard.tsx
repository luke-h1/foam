import useAppNavigation from '@app/hooks/useAppNavigation';
import twitchService, { Stream } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { Image, ImageStyle } from 'expo-image';
import { useState, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import LiveStreamImage from './LiveStreamImage';
import Tags from './Tags';
import { Text } from './ui/Text';

interface Props {
  stream: Stream;
}

export default function LiveStreamCard({ stream }: Props) {
  const [broadcasterImage, setBroadcasterImage] = useState<string>();
  const { navigate } = useAppNavigation();

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
        navigate('Streams', {
          screen: 'LiveStream',
          params: {
            id: stream.user_login,
          },
        });
      }}
    >
      <Text>
        <View style={$streamHeadline}>
          <LiveStreamImage
            animated
            thumbnail={stream.thumbnail_url}
            startedAt={stream.started_at}
            size="large"
          />
          <View style={$streamDetail}>
            <Text preset="eventTitle">{stream.title}</Text>
            <View style={$streamMetadata}>
              <View style={$userInfo}>
                <Image
                  source={{ uri: broadcasterImage }}
                  style={$avatar}
                  testID="LiveStreamCard-avatar"
                />
                <Text preset="tag">{stream.user_name}</Text>
              </View>
              <Text preset="eventTitle">
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

const $streamDetail: ViewStyle = {
  flex: 1,
  justifyContent: 'flex-start',
};

const $streamHeadline: ViewStyle = {
  flex: 1,
  flexDirection: 'row',
};

const $streamMetadata: ViewStyle = {
  marginTop: spacing.medium,
  flex: 1,
  flexDirection: 'column',
};
const $userInfo: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 5,
  marginBottom: 5,
};
const $avatar: ImageStyle = {
  width: 20,
  height: 20,
  borderRadius: 13,
  marginRight: 5,
};
