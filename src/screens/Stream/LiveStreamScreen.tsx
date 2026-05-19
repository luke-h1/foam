import { BlurView } from 'expo-blur';
import { Button } from '@app/components/Button/Button';
import { Chat } from '@app/components/Chat/Chat';
import { ChannelPredictionCard } from '@app/components/ChannelPredictionCard/ChannelPredictionCard';
import { ChannelPollCard } from '@app/components/ChannelPollCard/ChannelPollCard';
import { Icon } from '@app/components/Icon/Icon';
import {
  StreamPlayer,
  StreamPlayerPrewarm,
} from '@app/components/StreamPlayer/StreamPlayer';
import { Text } from '@app/components/ui/Text/Text';
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
  hasContentGate,
  isChatVisible,
  isLandscape,
  landscapeChatWidth,
  layoutHeight,
  screenWidth,
}: {
  fullscreenChatMode: FullscreenChatMode;
  hasContentGate: boolean;
  isChatVisible: boolean;
  isLandscape: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
  screenWidth: number;
}): { width: number; height: number } {
  if (isLandscape) {
    const visibleSidebarChatWidth =
      isChatVisible && fullscreenChatMode === 'sidebar'
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
}

export function getLiveStreamChatDimensions({
  fullscreenChatMode,
  hasContentGate,
  isLandscape,
  landscapeChatWidth,
  layoutHeight,
  screenWidth,
}: {
  fullscreenChatMode: FullscreenChatMode;
  hasContentGate: boolean;
  isLandscape: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
  screenWidth: number;
}): { width: number; height: number } {
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

  const videoHeight = hasContentGate ? layoutHeight : screenWidth * (9 / 16);
  return {
    width: Math.max(1, screenWidth),
    height: Math.max(1, layoutHeight - videoHeight),
  };
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
  const [isChatConnectionReady, setChatConnectionReady] = useState(false);
  const [videoLatencySeconds, setVideoLatencySeconds] = useState<number | null>(
    null,
  );
  const lastChatToggleTimeRef = useRef<number>(0);

  useEffect(() => {
    void ScreenOrientation.unlockAsync();
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const handleContentGateChange = useCallback((hasGate: boolean) => {
    setHasContentGate(hasGate);
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
    setHasContentGate(false);
    setChatConnectionReady(false);
    setVideoLatencySeconds(null);

    if (!normalizedLogin) {
      return;
    }

    const fallbackTimer = setTimeout(() => {
      setChatConnectionReady(true);
    }, CHAT_CONNECTION_FALLBACK_MS);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [normalizedLogin]);

  const handlePlayerLoaded = useCallback(() => {
    setChatConnectionReady(true);
  }, []);

  const handlePlaybackLatencyChange = useCallback((latencySeconds: number) => {
    setVideoLatencySeconds(latencySeconds);
  }, []);

  const { data: stream } = useQuery({
    ...twitchQueries.getStream(normalizedLogin),
    enabled: normalizedLogin.length > 0,
  });

  const { data: user } = useQuery({
    ...twitchQueries.getUser(normalizedLogin),
    enabled: normalizedLogin.length > 0 && !stream?.user_id,
  });

  const videoDimensions = useMemo(() => {
    return getLiveStreamVideoDimensions({
      fullscreenChatMode,
      hasContentGate,
      isChatVisible,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      screenWidth,
    });
  }, [
    fullscreenChatMode,
    hasContentGate,
    isChatVisible,
    isLandscape,
    landscapeChatWidth,
    layoutHeight,
    screenWidth,
  ]);

  const chatDimensions = useMemo(() => {
    return getLiveStreamChatDimensions({
      fullscreenChatMode,
      hasContentGate,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      screenWidth,
    });
  }, [
    fullscreenChatMode,
    hasContentGate,
    isLandscape,
    landscapeChatWidth,
    layoutHeight,
    screenWidth,
  ]);

  const videoWidth = useSharedValue(videoDimensions.width);
  const videoHeight = useSharedValue(videoDimensions.height);
  const chatWidth = useSharedValue(chatDimensions.width);
  const chatHeight = useSharedValue(chatDimensions.height);
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
    const chatHidden = !isChatVisible && isLandscape;
    const effectiveChatWidth = chatHidden ? 0 : chatDimensions.width;
    const effectiveChatHeight = chatHidden ? 0 : chatDimensions.height;

    videoWidth.value = withTiming(videoDimensions.width, layoutAnimationConfig);
    videoHeight.value = withTiming(
      videoDimensions.height,
      layoutAnimationConfig,
    );
    chatWidth.value = withTiming(effectiveChatWidth, layoutAnimationConfig);
    chatHeight.value = withTiming(effectiveChatHeight, layoutAnimationConfig);

    if (isChatVisible) {
      chatOpacity.value = withTiming(1, layoutAnimationConfig);
      chatTranslateX.value = withTiming(0, layoutAnimationConfig);
      return;
    }

    chatOpacity.value = withTiming(0, layoutAnimationConfig);
    chatTranslateX.value = withTiming(
      isLandscape ? chatDimensions.width : 0,
      layoutAnimationConfig,
    );
  }, [
    isLandscape,
    isChatVisible,
    videoDimensions,
    chatDimensions,
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
  const hasResolvedChannelLogin = Boolean(resolvedChannelLogin);
  const hasResolvedChannelId = Boolean(resolvedChannelId);
  const shouldMountChat =
    shouldRenderChat &&
    hasResolvedChannelLogin &&
    hasResolvedChannelId &&
    isChatConnectionReady;
  const shouldShowChatConnectionNotice =
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
            channel={resolvedChannelLogin}
            height="100%"
            width="100%"
            autoplay
            muted={false}
            onContentGateChange={handleContentGateChange}
            onPlay={handlePlayerLoaded}
            onPlaybackLatencyChange={handlePlaybackLatencyChange}
            onReady={handlePlayerLoaded}
            onVideoAreaPress={isLandscape ? cycleLandscapeChatMode : undefined}
            onVideoAreaSwipeDown={isLandscape ? handleExitLandscape : undefined}
            onWebViewLoaded={handlePlayerLoaded}
            showOverlayControls={false}
            streamInfo={streamInfo}
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
        {shouldMountChat || shouldShowChatConnectionNotice ? (
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
            <VideoDelayIndicator latencySeconds={videoLatencySeconds} />
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
            {shouldMountChat ? (
              <Chat
                key={resolvedChannelId}
                applyTopInset={isLandscape}
                channelId={resolvedChannelId!}
                channelName={resolvedChannelLogin!}
                transparent={isLandscape && fullscreenChatMode === 'overlay'}
              />
            ) : (
              <View style={styles.chatConnectionNotice}>
                <Icon color={theme.colorGrey} icon="message-circle" size={24} />
                <Text
                  align="center"
                  color="gray.contrast"
                  type="sm"
                  weight="semibold"
                >
                  Chat will connect when the stream starts.
                </Text>
                <Text align="center" color="gray" type="xs">
                  This can take up to 10 seconds so video playback stays first.
                </Text>
              </View>
            )}
          </View>
        ) : null}
        {isLandscape && (shouldMountChat || shouldShowChatConnectionNotice) ? (
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
