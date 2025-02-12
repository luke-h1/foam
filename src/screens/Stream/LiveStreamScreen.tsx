/* eslint-disable @typescript-eslint/no-unused-vars */
import { Spinner, Chat, Typography } from '@app/components';
import { StreamStackScreenProps } from '@app/navigators';
import { twitchQueries } from '@app/queries/twitchQueries';
import { twitchService, UserInfoResponse } from '@app/services';
import { useQueries } from '@tanstack/react-query';
import { FC, useEffect, useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import WebView from 'react-native-webview';

export const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
  route: { params },
}) => {
  const { styles } = useStyles(stylesheet);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const [, setStreamer] = useState<UserInfoResponse>();
  const [isPlaying, setIsPlaying] = useState(false);
  const webViewRef = useRef<WebView>(null);

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
  const { isLoading: isUserProfilePictureLoading } =
    userProfilePictureQueryResult;

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

  // 🔹 Animated Values for Smooth Resizing 🔹
  const videoHeight = useSharedValue(
    isLandscape ? screenHeight : screenWidth * (9 / 16),
  );
  const chatHeight = useSharedValue(
    isLandscape ? screenHeight : screenHeight - videoHeight.value,
  );
  useEffect(() => {
    if (stream) {
      setIsPlaying(true);
    }
  }, []);

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

  const togglePlayPause = () => {
    const script = `
      document.querySelector('[data-a-target="player-play-pause-button"]').click();
      window.ReactNativeWebView.postMessage(document.querySelector('[data-a-target="player-play-pause-button"]').getAttribute('aria-label'));
    `;
    setIsPlaying(prev => !prev);
    webViewRef.current?.injectJavaScript(script);
  };

  if (isStreamLoading || isUserLoading || isUserProfilePictureLoading) {
    return <Spinner />;
  }

  if (!stream) {
    return (
      <SafeAreaView style={styles.container}>
        <Typography style={styles.videoUser}>User Offline</Typography>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.contentContainer, isLandscape && styles.row]}>
        {/* ✅ Fixed Video Section */}
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
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
          />
          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePlayPause}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={30}
              color="#FFF"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* ✅ Chat Resizes Correctly */}
        <Animated.View style={[styles.chatContainer, animatedChatStyle]}>
          <Chat
            channelId={user?.id as string}
            channelName={stream.user_login as string}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const stylesheet = createStyleSheet(theme => ({
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
  chatContainer: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
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
