import { BlurView } from 'expo-blur';
import { Button } from '@app/components/Button/Button';
import { Chat } from '@app/components/Chat/Chat';
import { ChannelPredictionCard } from '@app/components/ChannelPredictionCard/ChannelPredictionCard';
import { ChannelPollCard } from '@app/components/ChannelPollCard/ChannelPollCard';
import { SymbolView } from 'expo-symbols';
import { StreamPlayer } from '@app/components/StreamPlayer/StreamPlayer';
import { Text } from '@app/components/ui/Text/Text';
import { useChannelPrediction } from '@app/hooks/useChannelPrediction';
import { useChannelPoll } from '@app/hooks/useChannelPoll';
import { twitchQueries } from '@app/queries/twitchQueries';
import { theme } from '@app/styles/themes';
import { usePreference } from '@app/store/preferenceStore';
import { useQuery } from '@tanstack/react-query';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
const CHAT_CONNECTION_FALLBACK_MS = 10_000;
const CHAT_TOGGLE_DEBOUNCE_MS = 450;
const MAX_OVERLAY_CHAT_FRACTION = 0.68;
const MAX_SIDEBAR_CHAT_FRACTION = 0.55;

export type FullscreenChatMode = 'sidebar' | 'overlay';
export type LandscapeChatCycleAction = 'hide' | 'show' | 'overlay';

function VideoDelayIndicator({
  latencySeconds,
}: {
  latencySeconds: number | null;
}) {
  const delayLabel =
    latencySeconds == null ? '--' : `${latencySeconds.toFixed(1)}s`;

  return (
    <View style={styles.delayIndicator}>
      <Text style={styles.delayIndicatorTitle}>Broadcaster latency</Text>
      <Text style={styles.delayIndicatorValue}>{delayLabel}</Text>
    </View>
  );
}

export function clampLandscapeChatWidth(
  width: number,
  screenWidth: number,
  mode: FullscreenChatMode,
): number {
  const minWidth = Math.min(LANDSCAPE_CHAT_MIN_WIDTH, screenWidth * 0.42);
  const maxFraction =
    mode === 'overlay' ? MAX_OVERLAY_CHAT_FRACTION : MAX_SIDEBAR_CHAT_FRACTION;
  const maxWidth = Math.max(minWidth, screenWidth * maxFraction);

  return Math.min(maxWidth, Math.max(minWidth, width));
}

export function getDefaultLandscapeChatWidth(
  mode: FullscreenChatMode,
  screenWidth: number,
): number {
  if (mode === 'overlay') {
    return Math.min(DEFAULT_OVERLAY_CHAT_WIDTH, screenWidth * 0.46);
  }

  return screenWidth * DEFAULT_SIDEBAR_CHAT_FRACTION;
}

export function getNextChatCycleAction(
  nextChatVisible: boolean,
  fullscreenChatMode: FullscreenChatMode,
): LandscapeChatCycleAction {
  if (!nextChatVisible) {
    return 'show';
  }

  return fullscreenChatMode === 'overlay' ? 'hide' : 'overlay';
}

export function getLiveStreamVideoDimensions({
  fullscreenChatMode,
  isChatEnabled,
  isChatVisible,
  isLandscape,
  landscapeChatWidth,
  layoutHeight,
  isStreamEnabled,
  screenWidth,
}: {
  fullscreenChatMode: FullscreenChatMode;
  isChatEnabled: boolean;
  isChatVisible: boolean;
  isLandscape: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
  isStreamEnabled: boolean;
  screenWidth: number;
}): { width: number; height: number } {
  if (!isStreamEnabled) {
    return { width: 0, height: 0 };
  }

  if (isLandscape) {
    const visibleSidebarChatWidth =
      isChatEnabled && isChatVisible && fullscreenChatMode === 'sidebar'
        ? clampLandscapeChatWidth(
            landscapeChatWidth ??
              getDefaultLandscapeChatWidth('sidebar', screenWidth),
            screenWidth,
            'sidebar',
          )
        : 0;
    return {
      width: Math.max(1, screenWidth - visibleSidebarChatWidth),
      height: Math.max(1, layoutHeight),
    };
  }
  return {
    width: Math.max(1, screenWidth),
    height: Math.max(1, screenWidth * (9 / 16)),
  };
}

export function getLiveStreamChatDimensions({
  fullscreenChatMode,
  isChatEnabled,
  isLandscape,
  landscapeChatWidth,
  layoutHeight,
  isStreamEnabled,
  screenWidth,
}: {
  fullscreenChatMode: FullscreenChatMode;
  isChatEnabled: boolean;
  isLandscape: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
  isStreamEnabled: boolean;
  screenWidth: number;
}): { width: number; height: number } {
  if (!isChatEnabled) {
    return { width: 0, height: 0 };
  }

  if (!isStreamEnabled) {
    return {
      width: Math.max(1, screenWidth),
      height: Math.max(1, layoutHeight),
    };
  }

  if (isLandscape) {
    return {
      width: clampLandscapeChatWidth(
        landscapeChatWidth ??
          getDefaultLandscapeChatWidth(fullscreenChatMode, screenWidth),
        screenWidth,
        fullscreenChatMode,
      ),
      height: Math.max(1, layoutHeight),
    };
  }

  const videoHeight = screenWidth * (9 / 16);
  return {
    width: Math.max(1, screenWidth),
    height: Math.max(1, layoutHeight - videoHeight),
  };
}

export const LiveStreamScreen = memo(function LiveStreamScreen({
  id,
}: LiveStreamScreenProps) {
  const normalizedLogin = useMemo(() => id.trim().toLowerCase(), [id]);
  const disableChat = usePreference('disableChat');
  const disableStream = usePreference('disableStream');
  const useUIKitForWebView = usePreference('useUIKitForWebView');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const safeFrame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();
  const isLandscape = windowWidth > windowHeight;
  const measuredWidth = Math.max(
    1,
    safeFrame.width > 0 ? safeFrame.width : windowWidth,
  );
  const measuredHeight = Math.max(
    1,
    safeFrame.height > 0 ? safeFrame.height : windowHeight,
  );
  const screenWidth = isLandscape
    ? Math.max(measuredWidth, measuredHeight)
    : Math.min(measuredWidth, measuredHeight);
  const screenHeight = isLandscape
    ? Math.min(measuredWidth, measuredHeight)
    : Math.max(measuredWidth, measuredHeight);
  const portraitTopInset = isLandscape ? 0 : insets.top;
  const layoutHeight = Math.max(1, screenHeight - portraitTopInset);
  const isChatEnabled = !disableChat;
  const isStreamEnabled = !disableStream;
  const [isChatVisible, setChatVisible] = useState<boolean>(true);
  const isChatVisibleForLayout = isChatVisible || !isStreamEnabled;
  const shouldRenderChat =
    isChatEnabled && (!isLandscape || isChatVisibleForLayout);
  const [fullscreenChatMode, setFullscreenChatMode] =
    useState<FullscreenChatMode>('sidebar');
  const [landscapeChatCycleAction, setLandscapeChatCycleAction] =
    useState<LandscapeChatCycleAction>('hide');
  const [landscapeChatWidth, setLandscapeChatWidth] = useState<number | null>(
    null,
  );
  const [isChatConnectionReady, setChatConnectionReady] = useState(false);
  const [videoLatencySeconds, setVideoLatencySeconds] = useState<number | null>(
    null,
  );
  const lastChatToggleTimeRef = useRef<number>(0);
  const previousIsLandscapeRef = useRef(isLandscape);

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);

    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const commitLandscapeChatWidth = useCallback(
    (width: number) => {
      setLandscapeChatWidth(
        clampLandscapeChatWidth(width, screenWidth, fullscreenChatMode),
      );
    },
    [fullscreenChatMode, screenWidth],
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

  const canToggleChat = useCallback(() => {
    const now = Date.now();
    if (now - lastChatToggleTimeRef.current < CHAT_TOGGLE_DEBOUNCE_MS) {
      return false;
    }

    lastChatToggleTimeRef.current = now;
    return true;
  }, []);

  const toggleChat = useCallback(() => {
    if (!canToggleChat()) {
      return;
    }

    setChatVisible(current => {
      const nextVisible = !current;
      setLandscapeChatCycleAction(
        getNextChatCycleAction(nextVisible, fullscreenChatMode),
      );
      return nextVisible;
    });
  }, [canToggleChat, fullscreenChatMode]);

  const cycleLandscapeChatMode = useCallback(() => {
    if (!canToggleChat()) {
      return;
    }

    applyLandscapeChatCycleAction(landscapeChatCycleAction);
  }, [applyLandscapeChatCycleAction, canToggleChat, landscapeChatCycleAction]);

  useEffect(() => {
    setChatConnectionReady(!isStreamEnabled);
    setVideoLatencySeconds(null);

    if (!normalizedLogin || !isStreamEnabled) {
      return;
    }

    const fallbackTimer = setTimeout(() => {
      setChatConnectionReady(true);
    }, CHAT_CONNECTION_FALLBACK_MS);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [isStreamEnabled, normalizedLogin]);

  const handlePlayerLoaded = useCallback(() => {
    setChatConnectionReady(true);
  }, []);

  const handlePlaybackLatencyChange = useCallback((latencySeconds: number) => {
    setVideoLatencySeconds(latencySeconds);
  }, []);

  const shouldResolveChannelIdentity = isChatEnabled || isStreamEnabled;
  const { data: stream } = useQuery({
    ...twitchQueries.getStream(normalizedLogin),
    enabled: isStreamEnabled && normalizedLogin.length > 0,
  });

  const { data: user } = useQuery({
    ...twitchQueries.getUser(normalizedLogin),
    enabled:
      shouldResolveChannelIdentity &&
      normalizedLogin.length > 0 &&
      (!isStreamEnabled || !stream?.user_id),
  });

  const videoDimensions = useMemo(() => {
    return getLiveStreamVideoDimensions({
      fullscreenChatMode,
      isChatEnabled,
      isChatVisible,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      isStreamEnabled,
      screenWidth,
    });
  }, [
    fullscreenChatMode,
    isChatEnabled,
    isChatVisible,
    isLandscape,
    landscapeChatWidth,
    layoutHeight,
    isStreamEnabled,
    screenWidth,
  ]);

  const chatDimensions = useMemo(() => {
    return getLiveStreamChatDimensions({
      fullscreenChatMode,
      isChatEnabled,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      isStreamEnabled,
      screenWidth,
    });
  }, [
    fullscreenChatMode,
    isChatEnabled,
    isLandscape,
    landscapeChatWidth,
    layoutHeight,
    isStreamEnabled,
    screenWidth,
  ]);

  const isLandscapeChatHidden = !isChatVisibleForLayout && isLandscape;
  const effectiveChatWidth = isLandscapeChatHidden ? 0 : chatDimensions.width;
  const effectiveChatHeight = isLandscapeChatHidden ? 0 : chatDimensions.height;

  const videoContainerLayoutStyle = useMemo(
    () => ({
      height: videoDimensions.height,
      width: videoDimensions.width,
    }),
    [videoDimensions.height, videoDimensions.width],
  );

  const chatContainerLayoutStyle = useMemo(
    () => ({
      height: effectiveChatHeight,
      width: effectiveChatWidth,
    }),
    [effectiveChatHeight, effectiveChatWidth],
  );

  const chatWidth = useSharedValue(effectiveChatWidth);
  const chatOpacity = useSharedValue(1);
  const chatTranslateX = useSharedValue(0);
  const resizeActive = useSharedValue(false);
  const resizeStartWidth = useSharedValue(0);
  const resizeHandleOpacity = useSharedValue(0.42);

  const animatedChatStyle = useAnimatedStyle(() => {
    const baseStyle = {
      opacity: chatOpacity.value,
      transform: [{ translateX: chatTranslateX.value }],
    };

    if (!resizeActive.value) {
      return baseStyle;
    }

    return {
      ...baseStyle,
      width: chatWidth.value,
    };
  });

  const layoutAnimationConfig = useMemo(
    () => ({
      duration: 320,
      easing: Easing.inOut(Easing.ease),
    }),
    [],
  );

  useLayoutEffect(() => {
    const orientationChanged = previousIsLandscapeRef.current !== isLandscape;

    previousIsLandscapeRef.current = isLandscape;

    chatWidth.value = effectiveChatWidth;
    resizeActive.value = false;

    if (isChatVisible) {
      chatOpacity.value = orientationChanged
        ? 1
        : withTiming(1, layoutAnimationConfig);
      chatTranslateX.value = orientationChanged
        ? 0
        : withTiming(0, layoutAnimationConfig);
      return;
    }

    chatOpacity.value = orientationChanged
      ? 0
      : withTiming(0, layoutAnimationConfig);
    chatTranslateX.value = orientationChanged
      ? isLandscape
        ? chatDimensions.width
        : 0
      : withTiming(
          isLandscape ? chatDimensions.width : 0,
          layoutAnimationConfig,
        );
  }, [
    isLandscape,
    isChatVisible,
    isChatVisibleForLayout,
    chatDimensions,
    effectiveChatWidth,
    layoutAnimationConfig,
    chatWidth,
    chatOpacity,
    chatTranslateX,
    resizeActive,
  ]);

  const animatedVideoStyle = useAnimatedStyle(() => {
    if (
      !resizeActive.value ||
      fullscreenChatMode !== 'sidebar' ||
      !isChatVisibleForLayout
    ) {
      return {};
    }

    return {
      width: Math.max(1, screenWidth - chatWidth.value),
    };
  });

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
          resizeActive.value = true;
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
        })
        .onFinalize(() => {
          resizeHandleOpacity.value = 0.42;
          scheduleOnRN(commitLandscapeChatWidth, chatWidth.value);
        }),
    [
      chatWidth,
      commitLandscapeChatWidth,
      fullscreenChatMode,
      resizeActive,
      resizeHandleOpacity,
      resizeStartWidth,
      screenWidth,
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
  const predictionChannelId = isStreamEnabled ? resolvedChannelId : undefined;
  const { prediction } = useChannelPrediction(predictionChannelId);
  const { poll } = useChannelPoll(predictionChannelId);
  const hasResolvedChannelLogin = Boolean(resolvedChannelLogin);
  const hasResolvedChannelId = Boolean(resolvedChannelId);
  const shouldMountChat =
    shouldRenderChat &&
    hasResolvedChannelLogin &&
    hasResolvedChannelId &&
    isChatConnectionReady;
  const shouldShowChatConnectionNotice =
    isStreamEnabled &&
    shouldRenderChat &&
    hasResolvedChannelLogin &&
    (!hasResolvedChannelId || !isChatConnectionReady);

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
      isStreamEnabled && resolvedChannelLogin
        ? {
            userName: stream?.user_name ?? user?.display_name,
            userLogin: resolvedChannelLogin,
            viewerCount: stream?.viewer_count,
            startedAt: stream?.started_at,
            gameName: stream?.game_name,
          }
        : undefined,
    [
      isStreamEnabled,
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
      <Animated.View
        style={[
          styles.videoContainer,
          videoContainerLayoutStyle,
          animatedVideoStyle,
        ]}
      >
        {isStreamEnabled && resolvedChannelLogin ? (
          <StreamPlayer
            channel={resolvedChannelLogin}
            height='100%'
            width='100%'
            autoplay
            muted={false}
            onPlay={handlePlayerLoaded}
            onPlaybackLatencyChange={handlePlaybackLatencyChange}
            onReady={handlePlayerLoaded}
            onVideoAreaPress={isLandscape ? cycleLandscapeChatMode : undefined}
            onVideoAreaSwipeDown={isLandscape ? handleExitLandscape : undefined}
            onWebViewLoaded={handlePlayerLoaded}
            streamInfo={streamInfo}
            useUIKitForWebView={useUIKitForWebView}
          />
        ) : null}
      </Animated.View>

      {isChatEnabled ? (
        <Animated.View
          style={[
            styles.chatContainer,
            chatContainerLayoutStyle,
            animatedChatStyle,
            landscapeChatContainerStyle,
          ]}
        >
          {shouldMountChat || shouldShowChatConnectionNotice ? (
            <View
              style={[
                styles.chatContent,
                isLandscape &&
                  fullscreenChatMode === 'overlay' &&
                  styles.overlayChatContent,
              ]}
            >
              {isStreamEnabled &&
              isLandscape &&
              fullscreenChatMode === 'overlay' ? (
                <BlurView
                  intensity={36}
                  style={styles.overlayChatBlur}
                  tint='dark'
                />
              ) : null}
              {isStreamEnabled ? (
                <VideoDelayIndicator latencySeconds={videoLatencySeconds} />
              ) : null}
              {isStreamEnabled && prediction && resolvedChannelLogin ? (
                <ChannelPredictionCard
                  channelLogin={resolvedChannelLogin}
                  prediction={prediction}
                />
              ) : null}
              {isStreamEnabled && poll && resolvedChannelLogin ? (
                <ChannelPollCard
                  channelLogin={resolvedChannelLogin}
                  poll={poll}
                />
              ) : null}
              {shouldMountChat ? (
                <Chat
                  key={resolvedChannelId}
                  applyTopInset={isLandscape && isStreamEnabled}
                  channelId={resolvedChannelId!}
                  channelName={resolvedChannelLogin}
                  transparent={
                    isStreamEnabled &&
                    isLandscape &&
                    fullscreenChatMode === 'overlay'
                  }
                />
              ) : (
                <View style={styles.chatConnectionNotice}>
                  <SymbolView
                    tintColor={theme.colorGrey}
                    name='message'
                    size={24}
                  />
                  <Text
                    align='center'
                    color='gray.contrast'
                    type='sm'
                    weight='semibold'
                  >
                    Chat will connect when the stream starts.
                  </Text>
                  <Text align='center' color='gray' type='xs'>
                    This can take up to 10 seconds so video playback stays
                    first.
                  </Text>
                </View>
              )}
            </View>
          ) : null}
          {isStreamEnabled &&
          isLandscape &&
          (shouldMountChat || shouldShowChatConnectionNotice) ? (
            <GestureDetector gesture={resizeChatGesture}>
              <Animated.View
                accessibilityLabel='Resize chat'
                accessibilityRole='adjustable'
                style={[styles.chatResizeHandle, animatedResizeHandleStyle]}
              >
                <View style={styles.chatResizeIndicator} />
              </Animated.View>
            </GestureDetector>
          ) : null}
        </Animated.View>
      ) : null}

      {isStreamEnabled && isChatEnabled && isLandscape ? (
        <Animated.View
          pointerEvents='box-none'
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
            <SymbolView
              tintColor={theme.colorWhite}
              name={isChatVisible ? 'eye.slash' : 'message'}
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
            <SymbolView
              tintColor={theme.colorWhite}
              name={
                fullscreenChatMode === 'overlay'
                  ? 'sidebar.left'
                  : 'rectangle.split.2x1'
              }
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
  chatConnectionNotice: {
    alignItems: 'center',
    flex: 1,
    gap: theme.space8,
    justifyContent: 'center',
    paddingHorizontal: theme.space24,
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
    ...StyleSheet.absoluteFill,
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
  delayIndicator: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackOverlayStrong,
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  delayIndicatorTitle: {
    color: theme.colorGrey,
    fontSize: theme.fontSize12,
    fontWeight: '600',
  },
  delayIndicatorValue: {
    color: theme.colorWhite,
    fontSize: theme.fontSize14,
    fontWeight: '700',
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
