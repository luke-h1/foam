import { Chat } from '@app/components/Chat/Chat';
import { Spinner } from '@app/components/Spinner/Spinner';
import {
  StreamPlayer,
  type StreamPlayerRef,
} from '@app/components/StreamPlayer/StreamPlayer';

import { StreamStackScreenProps } from '@app/navigators/StreamStackNavigator';
import { twitchQueries } from '@app/queries/twitchQueries';
import { useQueries } from '@tanstack/react-query';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

export const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
  route: { params },
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const safeFrame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();
  // Use safe area dimensions so video + chat fit inside insets (avoids chat clipping)
  const screenWidth = safeFrame.width;
  const screenHeight = safeFrame.height;
  const isLandscape = windowWidth > windowHeight;
  const prevOrientationRef = useRef(isLandscape);

  const [isChatVisible, setChatVisible] = useState<boolean>(true);
  const [shouldRenderChat, setShouldRenderChat] = useState<boolean>(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [hasContentGate, setHasContentGate] = useState(false);
  const streamPlayerRef = useRef<StreamPlayerRef>(null);
  const [chatReloadKey, setChatReloadKey] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastChatToggleTimeRef = useRef<number>(0);
  const CHAT_TOGGLE_DEBOUNCE_MS = 450;

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          streamPlayerRef.current?.forceRefresh();
          setChatReloadKey(k => k + 1);
        }
        appStateRef.current = nextState;
      },
    );
    return () => sub.remove();
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
    setShouldRenderChat(false);
    setWebViewLoaded(false);
    setHasContentGate(false);
    return () => {
      console.log('🚪 LiveStreamScreen unmounting, forcing fast cleanup...');
      setShouldRenderChat(false);
    };
  }, [params.id]);

  const handleWebViewLoaded = useCallback(() => setWebViewLoaded(true), []);

  const [streamQueryResult] = useQueries({
    queries: [twitchQueries.getStream(params.id)],
  });

  const { data: stream, isPending: isStreamPending } = streamQueryResult;

  // Render chat once stream + WebView are ready (or after max wait so chat syncs within ~5s)
  const MAX_WAIT_FOR_WEBVIEW_MS = 4000;
  useEffect(() => {
    if (!stream?.user_login || !stream?.user_id) return;
    if (webViewLoaded) {
      if (!shouldRenderChat) setShouldRenderChat(true);
      return;
    }
    const timeout = setTimeout(() => {
      setWebViewLoaded(true);
      setShouldRenderChat(true);
    }, MAX_WAIT_FOR_WEBVIEW_MS);
    return () => clearTimeout(timeout);
  }, [stream?.user_login, stream?.user_id, webViewLoaded, shouldRenderChat]);

  const getVideoDimensions = useCallback(() => {
    if (isLandscape) {
      // Video 65% / chat 35% when chat visible (chat a bit bigger so input isn’t squished)
      const videoFraction = isChatVisible ? 0.65 : 1;
      return {
        width: screenWidth * videoFraction,
        height: screenHeight,
      };
    }
    if (hasContentGate) {
      return {
        width: screenWidth,
        height: screenHeight * 0.75,
      };
    }
    return {
      width: screenWidth,
      height: screenWidth * (9 / 16),
    };
  }, [isLandscape, isChatVisible, hasContentGate, screenWidth, screenHeight]);

  const getChatDimensions = useCallback(() => {
    if (isLandscape) {
      // Chat 35% when visible (video 65%)
      return {
        width: screenWidth * 0.35,
        height: screenHeight,
      };
    }
    const videoHeight = hasContentGate
      ? screenHeight * 0.75
      : screenWidth * (9 / 16);
    return {
      width: screenWidth,
      height: screenHeight - videoHeight,
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

  useEffect(() => {
    const videoDims = getVideoDimensions();
    const chatDims = getChatDimensions();
    const orientationChanged = prevOrientationRef.current !== isLandscape;
    prevOrientationRef.current = isLandscape;
    // No animation on orientation change to avoid lag; animate only for chat toggle
    const layoutDuration = orientationChanged ? 0 : 300;

    videoWidth.value = withTiming(videoDims.width, {
      duration: layoutDuration,
    });
    videoHeight.value = withTiming(videoDims.height, {
      duration: layoutDuration,
    });
    chatWidth.value = withTiming(chatDims.width, { duration: layoutDuration });
    chatHeight.value = withTiming(chatDims.height, {
      duration: layoutDuration,
    });

    if (isChatVisible) {
      chatOpacity.value = withTiming(1, { duration: layoutDuration });
      chatTranslateX.value = withTiming(0, { duration: layoutDuration });
    } else {
      chatOpacity.value = withTiming(0, { duration: layoutDuration });
      if (isLandscape) {
        chatTranslateX.value = withTiming(chatDims.width, {
          duration: layoutDuration,
        });
      }
    }
  }, [
    isLandscape,
    isChatVisible,
    hasContentGate,
    screenWidth,
    screenHeight,
    getVideoDimensions,
    getChatDimensions,
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

  if (isStreamPending) {
    return <Spinner />;
  }

  return (
    <SafeAreaView
      style={[styles.contentContainer, isLandscape && styles.row]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <Animated.View style={[styles.videoContainer, animatedVideoStyle]}>
        {stream?.user_login && (
          <StreamPlayer
            ref={streamPlayerRef}
            channel={stream.user_login ?? params.id}
            height="100%"
            width="100%"
            autoplay
            muted={false}
            onContentGateChange={handleContentGateChange}
            onVideoAreaPress={isLandscape ? toggleChat : undefined}
            onWebViewLoaded={handleWebViewLoaded}
            streamInfo={{
              userName: stream.user_name,
              userLogin: stream.user_login,
              viewerCount: stream.viewer_count,
              startedAt: stream.started_at,
              gameName: stream.game_name,
            }}
          />
        )}
      </Animated.View>

      <Animated.View style={[styles.chatContainer, animatedChatStyle]}>
        {shouldRenderChat && stream?.user_login && stream.user_id && (
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
              key={chatReloadKey}
              channelId={stream.user_id}
              channelName={stream.user_login}
            />
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#000',
  },
  videoUser: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginTop: 20,
  },
  chatContainer: {
    overflow: 'hidden',
  },
  chatContent: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
}));
