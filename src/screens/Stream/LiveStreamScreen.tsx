import { BlurView } from 'expo-blur';
import { Button } from '@app/components/Button/Button';
import { Chat } from '@app/components/Chat/Chat';
import { ChannelPredictionCard } from '@app/components/ChannelPredictionCard/ChannelPredictionCard';
import { ChannelPollCard } from '@app/components/ChannelPollCard/ChannelPollCard';
import { Icon } from '@app/components/Icon/Icon';
import {
  StreamPlayer,
  StreamPlayerPrewarm,
  type StreamPlayerRef,
} from '@app/components/StreamPlayer/StreamPlayer';
import { useChannelPrediction } from '@app/hooks/useChannelPrediction';
import { useChannelPoll } from '@app/hooks/useChannelPoll';
import { twitchQueries } from '@app/queries/twitchQueries';
import { theme } from '@app/styles/themes';
import { useQuery } from '@tanstack/react-query';
import * as ScreenOrientation from 'expo-screen-orientation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
import { scheduleOnRN } from 'react-native-worklets';

interface LiveStreamScreenProps {
  id: string;
}

const DEFAULT_OVERLAY_CHAT_WIDTH = 380;
const DEFAULT_SIDEBAR_CHAT_FRACTION = 0.35;
const LANDSCAPE_CHAT_MIN_WIDTH = 280;
const LANDSCAPE_CHAT_RESIZE_LONG_PRESS_MS = 220;
const MAX_OVERLAY_CHAT_FRACTION = 0.68;
const MAX_SIDEBAR_CHAT_FRACTION = 0.55;

type FullscreenChatMode = 'sidebar' | 'overlay';
type LandscapeChatCycleAction = 'hide' | 'show' | 'overlay';

function clampLandscapeChatWidth(
  width: number,
  screenWidth: number,
  mode: FullscreenChatMode,
) {
  const minWidth = Math.min(LANDSCAPE_CHAT_MIN_WIDTH, screenWidth * 0.42);
  const maxFraction =
    mode === 'overlay' ? MAX_OVERLAY_CHAT_FRACTION : MAX_SIDEBAR_CHAT_FRACTION;
  const maxWidth = Math.max(minWidth, screenWidth * maxFraction);

  return Math.min(maxWidth, Math.max(minWidth, width));
}

export const LiveStreamScreen = memo(function LiveStreamScreen({
  id,
}: LiveStreamScreenProps) {
  const normalizedLogin = useMemo(() => id.trim().toLowerCase(), [id]);
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
  const portraitTopInset = isLandscape ? 0 : insets.top;
  const layoutHeight = Math.max(1, screenHeight - portraitTopInset);
  const [isChatVisible, setChatVisible] = useState<boolean>(true);
  const shouldRenderChat = !isLandscape || isChatVisible;
  const [fullscreenChatMode, setFullscreenChatMode] =
    useState<FullscreenChatMode>('sidebar');
  const [landscapeChatCycleAction, setLandscapeChatCycleAction] =
    useState<LandscapeChatCycleAction>('hide');
  const [landscapeChatWidth, setLandscapeChatWidth] = useState<number | null>(
    null,
  );
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

  const handlePlayerWebViewLoaded = useCallback(() => {
    setHasContentGate(false);
  }, []);

  const commitLandscapeChatWidth = useCallback(
    (width: number) => {
      setLandscapeChatWidth(
        clampLandscapeChatWidth(width, screenWidth, fullscreenChatMode),
      );
    },
    [fullscreenChatMode, screenWidth],
  );

  const getLandscapeChatWidth = useCallback(
    (mode: FullscreenChatMode) => {
      const defaultWidth =
        mode === 'overlay'
          ? Math.min(DEFAULT_OVERLAY_CHAT_WIDTH, screenWidth * 0.46)
          : screenWidth * DEFAULT_SIDEBAR_CHAT_FRACTION;

      return clampLandscapeChatWidth(
        landscapeChatWidth ?? defaultWidth,
        screenWidth,
        mode,
      );
    },
    [landscapeChatWidth, screenWidth],
  );

  const applyLandscapeChatCycleAction = useCallback(
    (action: LandscapeChatCycleAction) => {
      switch (action) {
        case 'hide':
          setChatVisible(false);
          setLandscapeChatCycleAction('show');
          return;
        case 'show':
          setFullscreenChatMode('sidebar');
          setChatVisible(true);
          setLandscapeChatCycleAction('overlay');
          return;
        case 'overlay':
          setFullscreenChatMode('overlay');
          setChatVisible(true);
          setLandscapeChatCycleAction('hide');
          return;
      }
    },
    [],
  );

  const toggleChat = useCallback(() => {
    const now = Date.now();
    if (now - lastChatToggleTimeRef.current < CHAT_TOGGLE_DEBOUNCE_MS) {
      return;
    }
    lastChatToggleTimeRef.current = now;
    setChatVisible(current => {
      const nextVisible = !current;
      setLandscapeChatCycleAction(
        nextVisible
          ? fullscreenChatMode === 'overlay'
            ? 'hide'
            : 'overlay'
          : 'show',
      );
      return nextVisible;
    });
  }, [fullscreenChatMode]);

  const cycleLandscapeChatMode = useCallback(() => {
    const now = Date.now();
    if (now - lastChatToggleTimeRef.current < CHAT_TOGGLE_DEBOUNCE_MS) {
      return;
    }
    lastChatToggleTimeRef.current = now;
    applyLandscapeChatCycleAction(landscapeChatCycleAction);
  }, [applyLandscapeChatCycleAction, landscapeChatCycleAction]);

  useEffect(() => {
    setHasContentGate(false);
  }, [normalizedLogin]);

  const { data: stream } = useQuery({
    ...twitchQueries.getStream(normalizedLogin),
    enabled: normalizedLogin.length > 0,
  });

  const { data: user } = useQuery({
    ...twitchQueries.getUser(normalizedLogin),
    enabled: normalizedLogin.length > 0 && !stream?.user_id,
  });

  const getVideoDimensions = useCallback(() => {
    if (isLandscape) {
      const landscapeChatWidth =
        isChatVisible && fullscreenChatMode === 'sidebar'
          ? getLandscapeChatWidth('sidebar')
          : 0;
      return {
        width: Math.max(1, screenWidth - landscapeChatWidth),
        height: Math.max(1, layoutHeight),
      };
    }
    if (hasContentGate) {
      return {
        width: Math.max(1, screenWidth),
        height: Math.max(1, layoutHeight),
      };
    }
    return {
      width: Math.max(1, screenWidth),
      height: Math.max(1, screenWidth * (9 / 16)),
    };
  }, [
    fullscreenChatMode,
    getLandscapeChatWidth,
    hasContentGate,
    isChatVisible,
    isLandscape,
    layoutHeight,
    screenWidth,
  ]);

  const getChatDimensions = useCallback(() => {
    let width: number;
    let height: number;
    if (isLandscape) {
      width = getLandscapeChatWidth(fullscreenChatMode);
      height = layoutHeight;
    } else {
      const videoHeight = hasContentGate
        ? layoutHeight
        : screenWidth * (9 / 16);
      width = screenWidth;
      height = layoutHeight - videoHeight;
    }
    return {
      width: Math.max(1, width),
      height: Math.max(1, height),
    };
  }, [
    fullscreenChatMode,
    getLandscapeChatWidth,
    hasContentGate,
    isLandscape,
    layoutHeight,
    screenWidth,
  ]);

  const videoWidth = useSharedValue(getVideoDimensions().width);
  const videoHeight = useSharedValue(getVideoDimensions().height);
  const chatWidth = useSharedValue(getChatDimensions().width);
  const chatHeight = useSharedValue(getChatDimensions().height);
  const chatOpacity = useSharedValue(1);
  const chatTranslateX = useSharedValue(0);
  const resizeStartWidth = useSharedValue(0);
  const resizeHandleOpacity = useSharedValue(0.42);

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

  useEffect(() => {
    const videoDims = getVideoDimensions();
    const chatDims = getChatDimensions();
    const chatHidden = !isChatVisible && isLandscape;
    const effectiveChatWidth = chatHidden ? 0 : chatDims.width;
    const effectiveChatHeight = chatHidden ? 0 : chatDims.height;

    videoWidth.value = withTiming(videoDims.width, layoutAnimationConfig);
    videoHeight.value = withTiming(videoDims.height, layoutAnimationConfig);
    chatWidth.value = withTiming(effectiveChatWidth, layoutAnimationConfig);
    chatHeight.value = withTiming(effectiveChatHeight, layoutAnimationConfig);

    if (isChatVisible) {
      chatOpacity.value = withTiming(1, layoutAnimationConfig);
      chatTranslateX.value = withTiming(0, layoutAnimationConfig);
      return;
    }

    chatOpacity.value = withTiming(0, layoutAnimationConfig);
    chatTranslateX.value = withTiming(
      isLandscape ? chatDims.width : 0,
      layoutAnimationConfig,
    );
  }, [
    fullscreenChatMode,
    isLandscape,
    isChatVisible,
    hasContentGate,
    screenWidth,
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

  const animatedFullscreenControlsStyle = useAnimatedStyle(() => ({
    right: theme.space16 + chatWidth.value,
  }));

  const animatedResizeHandleStyle = useAnimatedStyle(() => ({
    opacity: resizeHandleOpacity.value,
  }));

  const resizeChatGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LANDSCAPE_CHAT_RESIZE_LONG_PRESS_MS)
        .onBegin(() => {
          resizeStartWidth.value = chatWidth.value;
          resizeHandleOpacity.value = 0.9;
        })
        .onUpdate(event => {
          const maxFraction =
            fullscreenChatMode === 'overlay'
              ? MAX_OVERLAY_CHAT_FRACTION
              : MAX_SIDEBAR_CHAT_FRACTION;
          const minWidth = Math.min(
            LANDSCAPE_CHAT_MIN_WIDTH,
            screenWidth * 0.42,
          );
          const maxWidth = Math.max(minWidth, screenWidth * maxFraction);
          const nextWidth = Math.min(
            maxWidth,
            Math.max(minWidth, resizeStartWidth.value - event.translationX),
          );

          chatWidth.value = nextWidth;
          if (fullscreenChatMode === 'sidebar' && isChatVisible) {
            videoWidth.value = Math.max(1, screenWidth - nextWidth);
          }
        })
        .onFinalize(() => {
          resizeHandleOpacity.value = 0.42;
          scheduleOnRN(commitLandscapeChatWidth, chatWidth.value);
        }),
    [
      chatWidth,
      commitLandscapeChatWidth,
      fullscreenChatMode,
      isChatVisible,
      resizeHandleOpacity,
      resizeStartWidth,
      screenWidth,
      videoWidth,
    ],
  );

  const contentContainerStyle = useMemo(
    () => [
      styles.contentContainer,
      !isLandscape && { paddingTop: portraitTopInset },
      isLandscape && styles.row,
    ],
    [isLandscape, portraitTopInset],
  );

  const resolvedChannelLogin =
    stream?.user_login ?? user?.login ?? normalizedLogin;
  const resolvedChannelId = stream?.user_id ?? user?.id;
  const { prediction } = useChannelPrediction(resolvedChannelId);
  const { poll } = useChannelPoll(resolvedChannelId);
  const shouldMountChat =
    shouldRenderChat &&
    Boolean(resolvedChannelLogin) &&
    Boolean(resolvedChannelId);

  const handleExitLandscape = useCallback(() => {
    if (!isLandscape) {
      return;
    }
    setChatVisible(true);
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
  }, [isLandscape]);

  const toggleFullscreenChatMode = useCallback(() => {
    setChatVisible(true);
    setFullscreenChatMode(current => {
      const nextMode = current === 'sidebar' ? 'overlay' : 'sidebar';
      setLandscapeChatCycleAction(nextMode === 'overlay' ? 'hide' : 'overlay');
      return nextMode;
    });
  }, []);

  const landscapeChatContainerStyle = useMemo(() => {
    if (!isLandscape || fullscreenChatMode !== 'overlay') {
      return undefined;
    }

    return {
      position: 'absolute' as const,
      right: 0,
      top: 0,
      zIndex: 3,
    };
  }, [fullscreenChatMode, isLandscape]);

  const streamInfo = useMemo(
    () =>
      resolvedChannelLogin
        ? {
            userName: stream?.user_name ?? user?.display_name,
            userLogin: resolvedChannelLogin,
            viewerCount: stream?.viewer_count,
            startedAt: stream?.started_at,
            gameName: stream?.game_name,
          }
        : undefined,
    [
      resolvedChannelLogin,
      stream?.user_name,
      stream?.viewer_count,
      stream?.started_at,
      stream?.game_name,
      user?.display_name,
    ],
  );

  return (
    <View style={contentContainerStyle}>
      {resolvedChannelLogin ? (
        <StreamPlayerPrewarm parent="www.twitch.tv" />
      ) : null}
      <Animated.View style={[styles.videoContainer, animatedVideoStyle]}>
        {resolvedChannelLogin ? (
          <StreamPlayer
            ref={streamPlayerRef}
            channel={resolvedChannelLogin}
            height="100%"
            width="100%"
            autoplay
            muted={false}
            onContentGateChange={handleContentGateChange}
            onWebViewLoaded={handlePlayerWebViewLoaded}
            onVideoAreaPress={isLandscape ? cycleLandscapeChatMode : undefined}
            onVideoAreaSwipeDown={isLandscape ? handleExitLandscape : undefined}
            streamInfo={streamInfo}
            useRawTwitchPlayer
          />
        ) : null}
      </Animated.View>

      <Animated.View
        style={[
          styles.chatContainer,
          animatedChatStyle,
          landscapeChatContainerStyle,
        ]}
      >
        {shouldMountChat ? (
          <View
            style={[
              styles.chatContent,
              isLandscape &&
                fullscreenChatMode === 'overlay' &&
                styles.overlayChatContent,
            ]}
          >
            {isLandscape && fullscreenChatMode === 'overlay' ? (
              <BlurView
                intensity={36}
                style={styles.overlayChatBlur}
                tint="dark"
              />
            ) : null}
            {prediction && resolvedChannelLogin ? (
              <ChannelPredictionCard
                channelLogin={resolvedChannelLogin}
                prediction={prediction}
              />
            ) : null}
            {poll && resolvedChannelLogin ? (
              <ChannelPollCard
                channelLogin={resolvedChannelLogin}
                poll={poll}
              />
            ) : null}
            <Chat
              key={resolvedChannelId}
              applyTopInset={isLandscape}
              channelId={resolvedChannelId!}
              channelName={resolvedChannelLogin!}
              transparent={isLandscape && fullscreenChatMode === 'overlay'}
            />
          </View>
        ) : null}
        {isLandscape && shouldMountChat ? (
          <GestureDetector gesture={resizeChatGesture}>
            <Animated.View
              accessibilityLabel="Resize chat"
              accessibilityRole="adjustable"
              style={[styles.chatResizeHandle, animatedResizeHandleStyle]}
            >
              <View style={styles.chatResizeIndicator} />
            </Animated.View>
          </GestureDetector>
        ) : null}
      </Animated.View>

      {isLandscape ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.fullscreenChatControls,
            { top: insets.top + theme.space12 },
            animatedFullscreenControlsStyle,
          ]}
        >
          <Button
            label={isChatVisible ? 'Hide chat' : 'Show chat'}
            onPress={toggleChat}
            style={styles.fullscreenChatControlButton}
          >
            <Icon
              color={theme.colorWhite}
              icon={isChatVisible ? 'eye-off' : 'message-circle'}
              size={16}
            />
          </Button>
          <Button
            label={
              fullscreenChatMode === 'overlay'
                ? 'Use sidebar chat'
                : 'Use overlay chat'
            }
            onPress={toggleFullscreenChatMode}
            style={styles.fullscreenChatControlButton}
          >
            <Icon
              color={theme.colorWhite}
              icon={fullscreenChatMode === 'overlay' ? 'sidebar' : 'layout'}
              size={16}
            />
          </Button>
        </Animated.View>
      ) : null}
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
  chatResizeHandle: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    width: 24,
    zIndex: 8,
  },
  chatResizeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.46)',
    borderRadius: theme.borderRadius999,
    height: 48,
    width: 3,
  },
  overlayChatBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayChatContent: {
    backgroundColor: 'rgba(10, 11, 16, 0.42)',
    borderLeftColor: theme.colorBorderSecondary,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    backgroundColor: '#000',
    flex: 1,
  },
  fullscreenChatControlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  fullscreenChatControls: {
    flexDirection: 'row',
    gap: theme.space8,
    position: 'absolute',
    zIndex: 12,
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
