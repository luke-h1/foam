import { Spinner, Chat, Typography } from '@app/components';
import { StreamStackScreenProps } from '@app/navigators';
import { twitchQueries } from '@app/queries/twitchQueries';
import { twitchService, UserInfoResponse } from '@app/services';
import { useQueries } from '@tanstack/react-query';
import { FC, useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import WebView from 'react-native-webview';

export const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
  route: { params },
}) => {
  const { styles } = useStyles(stylesheet);
  const screenWidth = Dimensions.get('screen').width;
  const screenHeight = Dimensions.get('screen').height;
  const videoHeight = screenWidth * (9 / 16);
  const [streamer, setStreamer] = useState<UserInfoResponse>();

  const [availableHeight, setAvailableHeight] = useState(
    screenHeight - videoHeight,
  );

  useEffect(() => {
    const updateAvailableHeight = () => {
      const { height, width } = Dimensions.get('window');
      const newVideoHeight = width * (9 / 16);
      setAvailableHeight(height - newVideoHeight);
    };

    Dimensions.addEventListener('change', updateAvailableHeight);
  }, []);

  const [streamQueryResult, userQueryResult, userProfilePictureQueryResult] =
    useQueries({
      queries: [
        twitchQueries.getStream(params.id),
        twitchQueries.getUser(params.id),
        twitchQueries.getUserImage(params.id),
      ],
    });

  const { data: stream, isLoading: isStreamLoading } = streamQueryResult;

  const { data: user, isLoading: isUserLoading } = userQueryResult;

  const { data: userProfilePicture, isLoading: isUserProfilePictureLoading } =
    userProfilePictureQueryResult;

  const { width } = Dimensions.get('window');

  const fetchUser = async () => {
    const result = await twitchService.getUser(params.id);
    setStreamer(result);
  };

  useEffect(() => {
    if (!isStreamLoading && !stream) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  if (isStreamLoading || isUserLoading || isUserProfilePictureLoading) {
    return <Spinner />;
  }

  if (!stream) {
    // user is offline twitchService.getUser
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Image
            source={{
              uri: streamer?.offline_image_url,
            }}
            style={{
              width: screenWidth,
              height: 300,
            }}
          />
          <View style={styles.videoDetails}>
            <View style={styles.videoMetadata}>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: userProfilePicture }}
                  style={styles.avatar}
                />
                <Typography style={styles.videoUser}>
                  {user?.display_name} - Offline
                </Typography>
              </View>
            </View>
          </View>
          <View style={styles.chatContainer(availableHeight)}>
            {/* <Chat
              channelId={user?.id as string}
              channelName={streamer?.user_login as string}
            /> */}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <WebView
          source={{
            uri: `https://player.twitch.tv?channel=${stream.user_login}&controls=true&parent=localhost&autoplay=true`,
          }}
          style={[
            styles.webView,
            {
              width,
              height: width * (9 / 16),
            },
          ]}
          allowsInlineMediaPlayback
        />
        <View style={styles.videoDetails}>
          <View style={styles.videoTitleContainer}>
            <Typography style={styles.videoTitle} size="xs">
              {stream.title}
            </Typography>
            <Typography style={styles.videoTitle} size="xs">
              {stream.game_name}
            </Typography>
          </View>
          <View style={styles.videoMetadata}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: userProfilePicture }}
                style={styles.avatar}
              />
              <Typography style={styles.videoUser}>
                {user?.display_name}
              </Typography>
            </View>
            <Typography style={styles.videoViews}>
              {new Intl.NumberFormat('en-US').format(
                stream.viewer_count as number,
              )}{' '}
              viewers
            </Typography>
          </View>
        </View>
        <View style={styles.chatContainer(availableHeight)}>
          <Chat
            channelId={user?.id as string}
            channelName={stream.user_login as string}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  webView: {
    overflow: 'hidden',
  },
  videoDetails: {
    padding: 10,
    width: '100%',
  },
  videoTitleContainer: {
    marginBottom: 10,
    flexDirection: 'column',
  },
  videoTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
  },
  videoMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  videoUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoViews: {
    fontSize: 16,
    color: theme.colors.border,
  },
  chatContainer: (height: number) => ({
    maxHeight: height,
  }),
}));
