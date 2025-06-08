import { Chat, Screen, Spinner, Typography } from '@app/components';
import { StreamStackScreenProps } from '@app/navigators';
import { twitchQueries } from '@app/queries/twitchQueries';
import { useQueries } from '@tanstack/react-query';
import { FC, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import WebView from 'react-native-webview';

export const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
  route: { params },
}) => {
  const { styles } = useStyles(stylesheet);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const webViewRef = useRef<WebView>(null);

  const [streamQueryResult, userQueryResult, userProfilePictureQueryResult] =
    useQueries({
      queries: [
        twitchQueries.getStream(params.id),
        twitchQueries.getUser(params.id),
        twitchQueries.getUserImage(params.id),
      ],
    });

  const { data: stream, isPending: isStreamPending } = streamQueryResult;
  const { data: user, isPending: isUserPending } = userQueryResult;
  const { isPending: isPfpPending } = userProfilePictureQueryResult;

  const videoHeight = useSharedValue(
    isLandscape ? screenHeight : screenWidth * (9 / 16),
  );
  const chatHeight = useSharedValue(
    isLandscape ? screenHeight : screenHeight - videoHeight.value,
  );

  useEffect(() => {
    videoHeight.value = withTiming(
      isLandscape ? screenHeight : screenWidth * (9 / 16),
      { duration: 300 },
    );
    chatHeight.value = withTiming(
      isLandscape ? screenHeight : screenHeight - videoHeight.value,
      { duration: 300 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLandscape, screenWidth, screenHeight]);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    height: videoHeight.value,
    width: isLandscape ? screenWidth * 0.6 : screenWidth,
  }));

  const animatedChatStyle = useAnimatedStyle(() => ({
    height: chatHeight.value,
    width: isLandscape ? screenWidth * 0.4 : screenWidth,
  }));

  // eslint-disable-next-line no-shadow
  const getWebViewStyle = (isLandscape: boolean) => ({
    width: isLandscape ? 600 : 400,
    height: '100%',
  });

  if (isStreamPending || isPfpPending) {
    return <Spinner />;
  }

  if (!stream) {
    return (
      <Screen style={styles.container}>
        <Typography style={styles.videoUser}>User Offline</Typography>
      </Screen>
    );
  }

  return (
    <Screen style={[styles.contentContainer, isLandscape && styles.row]}>
      <Animated.View style={[styles.videoContainer, animatedVideoStyle]}>
        <WebView
          ref={webViewRef}
          source={{
            uri: `https://player.twitch.tv/?channel=${stream.user_login}&parent=foam.lhowsam.com&autoplay=true`,
          }}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          style={getWebViewStyle(isLandscape)}
          allowsInlineMediaPlayback
          javaScriptEnabled
        />
      </Animated.View>

      <Animated.View style={[animatedChatStyle]}>
        {!isUserPending && user?.id && (
          <Chat channelId={user?.id} channelName={stream.user_login} />
        )}
      </Animated.View>
    </Screen>
  );
};

const stylesheet = createStyleSheet(() => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  videoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  videoUser: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  controlButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 10,
  },
}));
