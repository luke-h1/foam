import useThemeColor from '@app/hooks/useThemeColor';
import twitchService, { Stream } from '@app/services/twitchService';
import theme from '@app/styles/theme';
import { Image, ImageStyle } from 'expo-image';
import { useState, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import LiveStreamImage from './LiveStreamImage';
import Tags from './Tags';
import Text from './Text';

interface Props {
  stream: Stream;
}

export default function LiveStreamCard({ stream }: Props) {
  const shadow = useThemeColor({ light: theme.dropShadow, dark: undefined });
  const [broadcasterImage, setBroadcasterImage] = useState<string>();

  const getUserProfilePictures = async () => {
    const res = await twitchService.getUserImage(stream.user_login);
    setBroadcasterImage(res);
  };

  useEffect(() => {
    getUserProfilePictures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <TouchableOpacity activeOpacity={0.8}>
      <View style={[styles.streamCard, shadow]}>
        <View style={styles.streamHeadline}>
          <LiveStreamImage
            animated
            thumbnail={stream.thumbnail_url}
            startedAt={stream.started_at}
            size="large"
          />
          <View style={styles.streamDetail}>
            <Text size="xxs" weight="light">
              {stream.title}
            </Text>
            <View style={styles.streamMetadata}>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: broadcasterImage }}
                  style={styles.avatar}
                  testID="LiveStreamCard-avatar"
                />
                <Text size="xs" weight="bold">
                  {stream.user_name}
                </Text>
              </View>
              <Text size="xxs" weight="light">
                {new Intl.NumberFormat('en-US').format(stream.viewer_count)}{' '}
                viewers
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.xs }}>
          <Tags tags={stream.tags} />
        </View>
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
    padding: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.borderradii.sm,
    marginBottom: theme.spacing.md,
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
    marginTop: theme.spacing.md,
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
