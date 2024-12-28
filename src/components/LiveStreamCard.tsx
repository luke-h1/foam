import useAppNavigation from '@app/hooks/useAppNavigation';
import twitchService, { Stream } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import elapsedStreamTime from '@app/utils/elapsedStreamTime';
import { Image, ImageStyle } from 'expo-image';
import { useState, useEffect } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
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
      <View style={$streamHeadline}>
        <View style={$imageContainer}>
          <LiveStreamImage
            animated
            thumbnail={stream.thumbnail_url}
            size="large"
          />
          <View style={$overlay}>
            <View style={$redDot} />
            <Text style={$liveText}>
              {elapsedStreamTime(stream.started_at)}
            </Text>
          </View>
        </View>
        <View style={$streamDetail}>
          <Text preset="formLabel">{stream.title}</Text>
          <View style={$streamMetadata}>
            <View style={$userInfo}>
              <Image
                source={{ uri: broadcasterImage }}
                style={$avatar}
                testID="LiveStreamCard-avatar"
              />
              <Text preset="tag">{stream.user_name}</Text>
            </View>
            <Text preset="streamTitle">
              {new Intl.NumberFormat('en-US').format(stream.viewer_count)}{' '}
              viewers
            </Text>
          </View>
        </View>
      </View>

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

const $imageContainer: ViewStyle = {
  position: 'relative',
};

const $overlay: ViewStyle = {
  position: 'absolute',
  top: 3,
  left: 3,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 5,
};

const $redDot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: 'red',
  marginRight: 5,
};

const $liveText: TextStyle = {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
};
