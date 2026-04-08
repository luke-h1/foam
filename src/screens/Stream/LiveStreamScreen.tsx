import { Chat } from '@app/components/Chat/Chat';
import {
  StreamPlayer,
  StreamPlayerPrewarm,
  type StreamPlayerRef,
} from '@app/components/StreamPlayer/StreamPlayer';

import { StreamStackScreenProps } from '@app/navigators/StreamStackNavigator';
import { twitchQueries } from '@app/queries/twitchQueries';
import { useQueries } from '@tanstack/react-query';
import * as ScreenOrientation from 'expo-screen-orientation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

export const LiveStreamScreen = memo(function LiveStreamScreen({
  route: { params },
}: StreamStackScreenProps<'LiveStream'>) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const safeFrame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();
  const isLandscape = windowWidth > windowHeight;
  const screenWidth = Math.max(
    1,
    safeFrame.width > 0 ? safeFrame.width : windowWidth,
  );
  const screenHeight = Math.max(
    1,
    safeFrame.height > 0 ? safeFrame.height : windowHeight,
  );
  const prevOrientationRef = useRef(isLandscape);

  const [isChatVisible, setChatVisible] = useState<boolean>(true);
  const [hasContentGate, setHasContentGate] = useState(false);
  const streamPlayerRef = useRef<StreamPlayerRef>(null);
  const lastChatToggleTimeRef = useRef<number>(0);
  const CHAT_TOGGLE_DEBOUNCE_MS = 450;

  useEffect(() => {
    void ScreenOrientation.unlockAsync();
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const handleContentGateChange = useCallback((hasGate: boolean) => {
    setHasContentGate(prev => (prev === hasGate ? prev : hasGate));
  }, []);

  const toggleChat = useCallback(() => {
    const now = Date.now();
    if (now - lastChatToggleTimeRef.current < CHAT_TOGGLE_DEBOUNCE_MS) {
      return;
    }
    lastChatToggleTimeRef.current = now;
    setChatVisible(v => !v);
  }, []);

  useEffect(() => {
    setHasContentGate(false);
    return () => {
      if (__DEV__) {
        console.log('🚪 LiveStreamScreen unmounting, forcing fast cleanup...');
      }
    };
  }, [params.id]);

  const [streamQueryResult] = useQueries({
    queries: [twitchQueries.getStream(params.id)],
  });

  const { data: stream } = streamQueryResult;

  const getVideoDimensions = useCallback(() => {
    if (isLandscape) {
      // Video 65% / chat 35% when chat visible (chat a bit bigger so input isn’t squished)
      const videoFraction = isChatVisible ? 0.65 : 1;
      return {
        width: Math.max(1, screenWidth * videoFraction),
        height: Math.max(1, screenHeight),
      };
    }
    if (hasContentGate) {
      return {
        width: Math.max(1, screenWidth),
        height: Math.max(1, screenHeight * 0.75),
      };
    }
    return {
      width: Math.max(1, screenWidth),
      height: Math.max(1, screenWidth * (9 / 16)),
    };
  }, [isLandscape, isChatVisible, hasContentGate, screenWidth, screenHeight]);

  const getChatDimensions = useCallback(() => {
    let width: number;
    let height: number;
    if (isLandscape) {
      width = screenWidth * 0.35;
      height = screenHeight;
    } else {
      const videoHeight = hasContentGate
        ? screenHeight * 0.75
        : screenWidth * (9 / 16);
      width = screenWidth;
      height = screenHeight - videoHeight;
    }
    return {
      width: Math.max(1, width),
      height: Math.max(1, height),
    };
  }, [isLandscape, hasContentGate, screenWidth, screenHeight]);

  const videoWidth = useSharedValue(getVideoDimensions().width);
  const videoHeight = useSharedValue(getVideoDimensions().height);
  const chatWidth = useSharedValue(getChatDimensions().width);
  const chatHeight = useSharedValue(getChatDimensions().height);
  const chatOpacity = useSharedValue(1);
  const chatTranslateX = useSharedValue(0);

  const animatedChatStyle = useAnimatedStyle(() => ({
    width: chatWidth.value,
    height: chatHeight.value,
    opacity: chatOpacity.value,
    transform: [{ translateX: chatTranslateX.value }],
  }));

  const layoutAnimationConfig = useMemo(
    () => ({
      duration: 320,
      easing: Easing.inOut(Easing.ease),
    }),
    [],
  );

  const layoutDebounceMs = 120;
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIsLandscapeRef = useRef(isLandscape);
  const [layoutIsLandscape, setLayoutIsLandscape] = useState(isLandscape);

  useEffect(() => {
    const isOrientationChange = prevIsLandscapeRef.current !== isLandscape;
    prevOrientationRef.current = isLandscape;

    const applyLayout = () => {
      layoutTimeoutRef.current = null;
      prevIsLandscapeRef.current = isLandscape;
      setLayoutIsLandscape(isLandscape);

      const videoDims = getVideoDimensions();
      const chatDims = getChatDimensions();

      const chatHidden = !isChatVisible && isLandscape;
      const effectiveChatWidth = chatHidden ? 0 : chatDims.width;
      const effectiveChatHeight = chatHidden ? 0 : chatDims.height;

      if (isOrientationChange) {
        videoWidth.value = videoDims.width;
        videoHeight.value = videoDims.height;
        chatWidth.value = effectiveChatWidth;
        chatHeight.value = effectiveChatHeight;
        if (isChatVisible) {
          chatOpacity.value = 1;
          chatTranslateX.value = 0;
        } else {
          chatOpacity.value = 0;
          chatTranslateX.value = isLandscape ? chatDims.width : 0;
        }
      } else {
        videoWidth.value = withTiming(videoDims.width, layoutAnimationConfig);
        videoHeight.value = withTiming(videoDims.height, layoutAnimationConfig);
        chatWidth.value = withTiming(effectiveChatWidth, layoutAnimationConfig);
        chatHeight.value = withTiming(
          effectiveChatHeight,
          layoutAnimationConfig,
        );
        if (isChatVisible) {
          chatOpacity.value = withTiming(1, layoutAnimationConfig);
          chatTranslateX.value = withTiming(0, layoutAnimationConfig);
        } else {
          chatOpacity.value = withTiming(0, layoutAnimationConfig);
          if (isLandscape) {
            chatTranslateX.value = withTiming(
              chatDims.width,
              layoutAnimationConfig,
            );
          }
        }
      }
    };

    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }
    layoutTimeoutRef.current = setTimeout(applyLayout, layoutDebounceMs);

    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
        layoutTimeoutRef.current = null;
      }
    };
  }, [
    isLandscape,
    isChatVisible,
    hasContentGate,
    screenWidth,
    screenHeight,
    getVideoDimensions,
    getChatDimensions,
    layoutAnimationConfig,
    videoWidth,
    videoHeight,
    chatWidth,
    chatHeight,
    chatOpacity,
    chatTranslateX,
  ]);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    width: videoWidth.value,
    height: videoHeight.value,
  }));

  const contentContainerStyle = useMemo(
    () => [
      styles.contentContainer,
      layoutIsLandscape && styles.row,
      {
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      },
    ],
    [layoutIsLandscape, insets.top, insets.left, insets.right, insets.bottom],
  );

  const streamInfo = useMemo(
    () =>
      stream?.user_login
        ? {
            userName: stream.user_name,
            userLogin: stream.user_login,
            viewerCount: stream.viewer_count,
            startedAt: stream.started_at,
            gameName: stream.game_name,
          }
        : undefined,
    [
      stream?.user_login,
      stream?.user_name,
      stream?.viewer_count,
      stream?.started_at,
      stream?.game_name,
    ],
  );

  const channel = stream?.user_login ?? params.id;

  return (
    <View style={contentContainerStyle}>
      {channel ? <StreamPlayerPrewarm parent="www.twitch.tv" /> : null}
      <Animated.View style={[styles.videoContainer, animatedVideoStyle]}>
        {channel ? (
          <StreamPlayer
            ref={streamPlayerRef}
            channel={channel}
            deferOverlayUntilUserUnmute
            height="100%"
            width="100%"
            autoplay
            muted={false}
            onContentGateChange={handleContentGateChange}
            onVideoAreaPress={isLandscape ? toggleChat : undefined}
            streamInfo={streamInfo}
          />
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.chatContainer, animatedChatStyle]}>
        {stream?.user_login && stream?.user_id ? (
          <View
            style={[
              styles.chatContent,
              {
                paddingRight: insets.right,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <Chat
              key={stream.user_id}
              channelId={stream.user_id}
              channelName={stream.user_login}
            />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  chatContainer: {
    overflow: 'hidden',
  },
  chatContent: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  videoContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoUser: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
});
