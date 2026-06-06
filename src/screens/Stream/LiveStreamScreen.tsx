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
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';
import { theme } from '@app/styles/themes';
import { usePreference } from '@app/store/preferenceStore';
import { useQuery } from '@tanstack/react-query';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useCallback,
  memo,
  useMemo,
} from 'react';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { AppState, useWindowDimensions, View, StyleSheet } from 'react-native';
import type { StreamPlayerRef } from '@app/components/StreamPlayer/types';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import {
  clampLandscapeChatWidth,
  getLiveStreamChatDimensions,
  getLiveStreamLayoutMetrics,
  getLiveStreamVideoDimensions,
  getNextChatCycleAction,
  LANDSCAPE_CHAT_MIN_WIDTH,
  type LandscapeChatCycleAction,
} from './liveStreamLayout';
import {
  initialLiveStreamScreenState,
  liveStreamScreenReducer,
} from './liveStreamScreenReducer';

interface LiveStreamScreenProps {
  id: string;
}

const LANDSCAPE_CHAT_RESIZE_LONG_PRESS_MS = 220;
const CHAT_CONNECTION_FALLBACK_MS = 10_000;
const CHAT_TOGGLE_DEBOUNCE_MS = 450;
const MAX_OVERLAY_CHAT_FRACTION = 0.68;
const MAX_SIDEBAR_CHAT_FRACTION = 0.55;
const ORIENTATION_CHAT_SLIDE_DISTANCE = 28;
const RESIZE_ANIMATION_CONFIG = {
  duration: 150,
  easing: Easing.out(Easing.cubic),
};
const CHAT_REVEAL_ANIMATION_CONFIG = {
  duration: 110,
  easing: Easing.out(Easing.cubic),
};

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

export const LiveStreamScreen = memo(function LiveStreamScreen({
  id,
}: LiveStreamScreenProps) {
  const isFocused = useIsFocused();
  const streamPlayerRef = useRef<StreamPlayerRef>(null);
  const normalizedLogin = id.trim().toLowerCase();
  const disableChat = usePreference('disableChat');
  const disableStream = usePreference('disableStream');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isLandscape, layoutHeight, portraitTopInset, screenWidth } =
    getLiveStreamLayoutMetrics({
      insetTop: insets.top,
      windowHeight,
      windowWidth,
    });
  const isChatEnabled = !disableChat;
  const isStreamEnabled = !disableStream;
  const [uiState, dispatchUi] = useReducer(
    liveStreamScreenReducer,
    initialLiveStreamScreenState,
  );
  const {
    fullscreenChatMode,
    isChatConnectionReady,
    isChatVisible,
    landscapeChatCycleAction,
    landscapeChatWidth,
    videoLatencySeconds,
  } = uiState;
  const isChatVisibleForLayout = isChatVisible || !isStreamEnabled;
  const shouldRenderChat =
    isChatEnabled && (!isLandscape || isChatVisibleForLayout);
  const lastChatToggleTimeRef = useRef<number>(0);
  const previousIsLandscapeRef = useRef(isLandscape);
  const chatOrientationRevealFrameRef = useRef<number | null>(null);

  useEffect(() => {
    void ScreenOrientation.unlockAsync();
    const frameRef = chatOrientationRevealFrameRef;
    return () => {
      const frameId = frameRef.current;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameRef.current = null;
      }
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        streamPlayerRef.current?.pause();
        if (isStreamEnabled) {
          dispatchUi({
            type: 'patch',
            patch: {
              isChatConnectionReady: false,
              videoLatencySeconds: null,
            },
          });
        }
      };
    }, [isStreamEnabled]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'background' || nextState === 'inactive') {
        streamPlayerRef.current?.pause();
      }
    });

    return () => subscription.remove();
  }, []);

  const commitLandscapeChatWidth = (width: number) => {
    dispatchUi({
      type: 'setLandscapeChatWidth',
      landscapeChatWidth: clampLandscapeChatWidth(
        width,
        screenWidth,
        fullscreenChatMode,
      ),
    });
  };

  const applyLandscapeChatCycleAction = useCallback(
    (action: LandscapeChatCycleAction) => {
      switch (action) {
        case 'hide':
          dispatchUi({
            type: 'patch',
            patch: {
              isChatVisible: false,
              landscapeChatCycleAction: 'show',
            },
          });
          return;
        case 'show':
          dispatchUi({
            type: 'patch',
            patch: {
              fullscreenChatMode: 'sidebar',
              isChatVisible: true,
              landscapeChatCycleAction: 'overlay',
            },
          });
          return;
        case 'overlay':
          dispatchUi({
            type: 'patch',
            patch: {
              fullscreenChatMode: 'overlay',
              isChatVisible: true,
              landscapeChatCycleAction: 'hide',
            },
          });
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

  const toggleChat = () => {
    if (!canToggleChat()) {
      return;
    }

    const nextVisible = !isChatVisible;
    dispatchUi({
      type: 'patch',
      patch: {
        isChatVisible: nextVisible,
        landscapeChatCycleAction: getNextChatCycleAction(
          nextVisible,
          fullscreenChatMode,
        ),
      },
    });
  };

  const cycleLandscapeChatMode = useCallback(() => {
    if (!canToggleChat()) {
      return;
    }

    applyLandscapeChatCycleAction(landscapeChatCycleAction);
  }, [applyLandscapeChatCycleAction, canToggleChat, landscapeChatCycleAction]);

  const streamSessionKey = `${isStreamEnabled}:${normalizedLogin ?? ''}`;
  const lastStreamSessionKeyRef = useRef(streamSessionKey);

  useLayoutEffect(() => {
    if (lastStreamSessionKeyRef.current !== streamSessionKey) {
      lastStreamSessionKeyRef.current = streamSessionKey;
      dispatchUi({
        type: 'patch',
        patch: {
          isChatConnectionReady: !isStreamEnabled,
          videoLatencySeconds: null,
        },
      });
    }
  }, [isStreamEnabled, streamSessionKey]);

  useEffect(() => {
    if (!normalizedLogin || !isStreamEnabled) {
      return;
    }

    const fallbackTimer = setTimeout(() => {
      dispatchUi({
        type: 'setChatConnectionReady',
        isChatConnectionReady: true,
      });
    }, CHAT_CONNECTION_FALLBACK_MS);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [isStreamEnabled, normalizedLogin]);

  const handlePlayerLoaded = () => {
    dispatchUi({ type: 'setChatConnectionReady', isChatConnectionReady: true });
  };

  const handlePlaybackLatencyChange = (latencySeconds: number) => {
    dispatchUi({
      type: 'setVideoLatencySeconds',
      videoLatencySeconds: latencySeconds,
    });
  };

  const shouldResolveChannelIdentity = isChatEnabled || isStreamEnabled;
  const shouldFetchChannelMetadata = isFocused && normalizedLogin.length > 0;
  const { data: stream } = useQuery({
    ...twitchQueries.getStream(normalizedLogin),
    enabled: isStreamEnabled && shouldFetchChannelMetadata,
  });

  const { data: user } = useQuery({
    ...twitchQueries.getUser(normalizedLogin),
    enabled:
      shouldResolveChannelIdentity &&
      shouldFetchChannelMetadata &&
      (!isStreamEnabled || !stream?.user_id),
  });

  const videoDimensions = getLiveStreamVideoDimensions({
    fullscreenChatMode,
    isChatEnabled,
    isChatVisible,
    isLandscape,
    landscapeChatWidth,
    layoutHeight,
    isStreamEnabled,
    screenWidth,
  });

  const chatDimensions = getLiveStreamChatDimensions({
    fullscreenChatMode,
    isChatEnabled,
    isLandscape,
    landscapeChatWidth,
    layoutHeight,
    isStreamEnabled,
    screenWidth,
  });

  const isLandscapeChatHidden = !isChatVisibleForLayout && isLandscape;
  const effectiveChatWidth = isLandscapeChatHidden ? 0 : chatDimensions.width;
  const effectiveChatHeight = isLandscapeChatHidden ? 0 : chatDimensions.height;

  const videoWidth = useSharedValue(videoDimensions.width);
  const videoHeight = useSharedValue(videoDimensions.height);
  const chatWidth = useSharedValue(effectiveChatWidth);
  const chatHeight = useSharedValue(effectiveChatHeight);
  const chatOpacity = useSharedValue(1);
  const chatTranslateX = useSharedValue(0);
  const resizeStartWidth = useSharedValue(0);
  const resizeHandleOpacity = useSharedValue(0.42);

  const animatedChatStyle = useAnimatedStyle(() => ({
    height: chatHeight.get(),
    left: isLandscape ? Math.max(0, screenWidth - chatWidth.get()) : 0,
    opacity: chatOpacity.get(),
    top: isLandscape ? 0 : videoHeight.get(),
    transform: [{ translateX: chatTranslateX.get() }],
    width: chatWidth.get(),
  }));

  useLayoutEffect(() => {
    const orientationChanged = previousIsLandscapeRef.current !== isLandscape;

    previousIsLandscapeRef.current = isLandscape;

    if (orientationChanged) {
      if (chatOrientationRevealFrameRef.current !== null) {
        cancelAnimationFrame(chatOrientationRevealFrameRef.current);
        chatOrientationRevealFrameRef.current = null;
      }

      cancelAnimation(videoWidth);
      cancelAnimation(videoHeight);
      cancelAnimation(chatWidth);
      cancelAnimation(chatHeight);
      cancelAnimation(chatOpacity);
      cancelAnimation(chatTranslateX);

      videoWidth.set(videoDimensions.width);
      videoHeight.set(videoDimensions.height);
      chatWidth.set(effectiveChatWidth);
      chatHeight.set(effectiveChatHeight);

      if (isChatVisible) {
        chatOpacity.set(0);
        chatTranslateX.set(
          isLandscape
            ? Math.min(ORIENTATION_CHAT_SLIDE_DISTANCE, chatDimensions.width)
            : 0,
        );
        chatOrientationRevealFrameRef.current = requestAnimationFrame(() => {
          chatOrientationRevealFrameRef.current = null;
          chatOpacity.set(withTiming(1, CHAT_REVEAL_ANIMATION_CONFIG));
          chatTranslateX.set(
            isLandscape ? withTiming(0, CHAT_REVEAL_ANIMATION_CONFIG) : 0,
          );
        });
        return;
      }

      chatOpacity.set(0);
      chatTranslateX.set(isLandscape ? chatDimensions.width : 0);
      return;
    }

    videoWidth.set(withTiming(videoDimensions.width, RESIZE_ANIMATION_CONFIG));
    videoHeight.set(
      withTiming(videoDimensions.height, RESIZE_ANIMATION_CONFIG),
    );
    chatWidth.set(withTiming(effectiveChatWidth, RESIZE_ANIMATION_CONFIG));
    chatHeight.set(withTiming(effectiveChatHeight, RESIZE_ANIMATION_CONFIG));

    if (isChatVisible) {
      chatOpacity.set(withTiming(1, CHAT_REVEAL_ANIMATION_CONFIG));
      chatTranslateX.set(withTiming(0, CHAT_REVEAL_ANIMATION_CONFIG));
      return;
    }

    chatOpacity.set(withTiming(0, CHAT_REVEAL_ANIMATION_CONFIG));
    chatTranslateX.set(
      withTiming(
        isLandscape ? chatDimensions.width : 0,
        CHAT_REVEAL_ANIMATION_CONFIG,
      ),
    );
  }, [
    isLandscape,
    isChatVisible,
    isChatVisibleForLayout,
    videoDimensions,
    chatDimensions,
    effectiveChatWidth,
    effectiveChatHeight,
    videoWidth,
    videoHeight,
    chatWidth,
    chatHeight,
    chatOpacity,
    chatTranslateX,
  ]);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    height: videoHeight.get(),
    left: 0,
    top: 0,
    width: videoWidth.get(),
  }));

  const animatedFullscreenControlsStyle = useAnimatedStyle(() => ({
    right: theme.space16 + chatWidth.get(),
  }));

  const animatedResizeHandleStyle = useAnimatedStyle(() => ({
    opacity: resizeHandleOpacity.get(),
  }));

  const resizeChatGesture = Gesture.Pan()
    .activateAfterLongPress(LANDSCAPE_CHAT_RESIZE_LONG_PRESS_MS)
    .onBegin(() => {
      resizeStartWidth.set(chatWidth.get());
      resizeHandleOpacity.set(0.9);
    })
    .onUpdate(event => {
      const maxFraction =
        fullscreenChatMode === 'overlay'
          ? MAX_OVERLAY_CHAT_FRACTION
          : MAX_SIDEBAR_CHAT_FRACTION;
      const minWidth = Math.min(LANDSCAPE_CHAT_MIN_WIDTH, screenWidth * 0.42);
      const maxWidth = Math.max(minWidth, screenWidth * maxFraction);
      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, resizeStartWidth.get() - event.translationX),
      );

      chatWidth.set(nextWidth);
      if (fullscreenChatMode === 'sidebar' && isChatVisibleForLayout) {
        videoWidth.set(Math.max(1, screenWidth - nextWidth));
      }
    })
    .onFinalize(() => {
      resizeHandleOpacity.set(0.42);
      scheduleOnRN(commitLandscapeChatWidth, chatWidth.get());
    });

  const contentContainerStyle = [
    styles.contentContainer,
    !isLandscape && { paddingTop: portraitTopInset },
  ];

  const resolvedChannelLogin =
    stream?.user_login ?? user?.login ?? normalizedLogin;
  const resolvedChannelId = stream?.user_id ?? user?.id;
  const hasResolvedChannelLogin = Boolean(resolvedChannelLogin);
  const hasResolvedChannelId = Boolean(resolvedChannelId);
  const shouldShowChatConnectionNotice =
    isFocused &&
    isStreamEnabled &&
    shouldRenderChat &&
    hasResolvedChannelLogin &&
    (!hasResolvedChannelId || !isChatConnectionReady);
  const shouldRenderChatPanel =
    isChatEnabled && (shouldRenderChat || shouldShowChatConnectionNotice);
  const shouldMountChat =
    isFocused &&
    shouldRenderChat &&
    hasResolvedChannelLogin &&
    hasResolvedChannelId &&
    isChatConnectionReady;
  const shouldRenderStreamPlayer =
    isFocused && isStreamEnabled && hasResolvedChannelLogin;
  const shouldLoadChannelEngagement =
    isFocused && isStreamEnabled && hasResolvedChannelId;
  const predictionChannelId = shouldLoadChannelEngagement
    ? resolvedChannelId
    : undefined;
  const { prediction } = useChannelPrediction(predictionChannelId);
  const { poll } = useChannelPoll(predictionChannelId);

  const handleExitLandscape = () => {
    if (!isLandscape) {
      return;
    }
    dispatchUi({ type: 'setChatVisible', isChatVisible: true });
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
  };

  const toggleFullscreenChatMode = () => {
    const nextMode = fullscreenChatMode === 'sidebar' ? 'overlay' : 'sidebar';
    dispatchUi({
      type: 'patch',
      patch: {
        isChatVisible: true,
        fullscreenChatMode: nextMode,
        landscapeChatCycleAction: nextMode === 'overlay' ? 'hide' : 'overlay',
      },
    });
  };

  const landscapeChatContainerStyle =
    isLandscape && fullscreenChatMode === 'overlay'
      ? styles.overlayChatContainer
      : undefined;

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
      user?.display_name,
      stream?.viewer_count,
      stream?.started_at,
      stream?.game_name,
    ],
  );

  const handleSharePress = useCallback(() => {
    if (!resolvedChannelLogin) {
      return;
    }

    void shareDeepLink({
      kind: 'liveStream',
      login: resolvedChannelLogin,
      displayName: stream?.user_name ?? user?.display_name ?? undefined,
    });
  }, [resolvedChannelLogin, stream?.user_name, user?.display_name]);

  return (
    <View style={contentContainerStyle}>
      <Animated.View style={[styles.videoContainer, animatedVideoStyle]}>
        {shouldRenderStreamPlayer ? (
          <StreamPlayer
            ref={streamPlayerRef}
            channel={resolvedChannelLogin}
            height='100%'
            width='100%'
            autoplay
            muted={false}
            onPlay={handlePlayerLoaded}
            onPlaybackLatencyChange={handlePlaybackLatencyChange}
            onReady={handlePlayerLoaded}
            onSharePress={resolvedChannelLogin ? handleSharePress : undefined}
            onVideoAreaPress={isLandscape ? cycleLandscapeChatMode : undefined}
            onVideoAreaSwipeDown={isLandscape ? handleExitLandscape : undefined}
            onWebViewLoaded={handlePlayerLoaded}
            streamInfo={streamInfo}
          />
        ) : null}
      </Animated.View>

      {shouldRenderChatPanel ? (
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
              {shouldMountChat &&
              isStreamEnabled &&
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
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 1,
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
  overlayChatContainer: {
    zIndex: 3,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    backgroundColor: '#000',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
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
  videoContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  videoUser: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
});
