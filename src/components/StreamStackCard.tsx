import useAppNavigation from '@app/hooks/useAppNavigation';
import twitchService, { Stream } from '@app/services/twitchService';
import { colors, spacing } from '@app/styles';
import elapsedStreamTime from '@app/utils/elapsedStreamTime';
import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Tags from './Tags';
import { Text } from './ui/Text';

interface Props {
  stream: Stream;
}

export default function StreamStackCard({ stream }: Props) {
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
      style={$container}
      onPress={() => {
        navigate('Streams', {
          screen: 'LiveStream',
          params: {
            id: stream.user_login,
          },
        });
      }}
    >
      <View style={$wrapper}>
        <View style={$imageContainer}>
          <Image
            source={{
              uri: stream.thumbnail_url
                .replace('{width}', '1080')
                .replace('{height}', '1200'),
            }}
            style={$streamImage}
          />
          <View style={$overlay}>
            <View style={$redDot} />
            <Text style={$uptime}>{elapsedStreamTime(stream.started_at)}</Text>
          </View>
        </View>
        <View style={$content}>
          <Text style={$title}>{stream.title}</Text>
          <Text style={$category}>{stream.game_name}</Text>
          <Text style={$viewers}>{`${stream.viewer_count} viewers`}</Text>
          <View style={$userInfo}>
            {broadcasterImage && (
              <Image source={{ uri: broadcasterImage }} style={$userImage} />
            )}
            <Text style={$userName}>{stream.user_name}</Text>
          </View>
        </View>
        <View
          style={{ marginTop: spacing.extraSmall, padding: spacing.extraSmall }}
        >
          <Tags tags={stream.tags} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const $wrapper: ViewStyle = {
  borderColor: colors.border,
  borderStyle: 'solid',
  borderRadius: 8,
  borderWidth: 1,
  padding: 2,
};

const $container: ViewStyle = {
  flexDirection: 'column',
  marginBottom: 15,
  backgroundColor: colors.background,
  overflow: 'hidden',
  elevation: 2,
  shadowColor: colors.border,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.6,
  shadowRadius: 1,
};

const $imageContainer: ViewStyle = {
  position: 'relative',
};

const $streamImage: ImageStyle = {
  width: '100%',
  height: 150,
  resizeMode: 'stretch',
};

const $overlay: ViewStyle = {
  position: 'absolute',
  top: 5,
  left: 5,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  paddingHorizontal: 6,
  paddingVertical: 3,
  borderRadius: 4,
};

const $redDot: ViewStyle = {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: 'red',
  marginRight: 4,
};

const $uptime: TextStyle = {
  color: 'white',
  fontSize: 10,
  fontWeight: 'bold',
};

const $content: ViewStyle = {
  padding: 8,
};

const $title: TextStyle = {
  fontSize: 14,
  fontWeight: 'bold',
  marginBottom: 4,
};

const $category: TextStyle = {
  fontSize: 12,
  color: colors.textDim,
  marginBottom: 4,
};

const $viewers: TextStyle = {
  fontSize: 12,
  color: colors.textDim,
  marginBottom: 8,
};

const $userInfo: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

const $userImage: ImageStyle = {
  width: 30,
  height: 30,
  borderRadius: 15,
  marginRight: 8,
};

const $userName: TextStyle = {
  fontSize: 12,
  fontWeight: 'bold',
};
