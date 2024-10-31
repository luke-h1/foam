import useThemeColor from '@app/hooks/useThemeColor';
import { RootRoutes, RootStackParamList } from '@app/navigation/RootStack';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import twitchService, { Stream } from '@app/services/twitchService';
import theme from '@app/styles/theme';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Image, ImageStyle } from 'expo-image';
import { useState, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import LiveStreamImage from './LiveStreamImage';
import Tags from './Tags';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';

interface Props {
  stream: Stream;
}

export default function LiveStreamCard({ stream }: Props) {
  const shadow = useThemeColor({ light: theme.dropShadow, dark: undefined });
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
      activeOpacity={0.8}
      onPress={() => {
        navigate(RootRoutes.Stream, {
          screen: StreamRoutes.LiveStream,
          params: {
            id: stream.user_login,
          },
        });
      }}
    >
      <ThemedView
        style={[styles.streamCard, shadow]}
        dark="rgba(255,255,255,0.15)"
        light={theme.color.lightGrey}
      >
        <View style={styles.streamHeadline}>
          <LiveStreamImage
            animated
            thumbnail={stream.thumbnail_url}
            startedAt={stream.started_at}
            size="large"
          />
          <View style={styles.streamDetail}>
            <ThemedText fontSize={13} fontWeight="light">
              {stream.title}
            </ThemedText>
            <View style={styles.streamMetadata}>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: broadcasterImage }}
                  style={styles.avatar}
                  testID="LiveStreamCard-avatar"
                />
                <ThemedText fontSize={14} fontWeight="bold">
                  {stream.user_name}
                </ThemedText>
              </View>
              <ThemedText fontSize={13} fontWeight="light">
                {new Intl.NumberFormat('en-US').format(stream.viewer_count)}{' '}
                viewers
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.xs }}>
          <Tags tags={stream.tags} />
        </View>
      </ThemedView>
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
