import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BlurView } from 'expo-blur';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { toast } from 'sonner-native';

import { Button } from '@app/components/Button/Button';
import { ChannelPollCard } from '@app/components/ChannelPollCard/ChannelPollCard';
import { ChannelPredictionCard } from '@app/components/ChannelPredictionCard/ChannelPredictionCard';
import { Chat } from '@app/components/Chat/Chat';
import { MEDIA_THUMBNAIL_SIZE } from '@app/components/LiveStreamCard/thumbnailSizes';
import { StreamPlayer } from '@app/components/StreamPlayer/StreamPlayer';
import type { StreamPlayerRef } from '@app/components/StreamPlayer/types';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useStreamQuery } from '@app/hooks/queries/useStreamQuery';
import { useUserQuery } from '@app/hooks/queries/useUserQuery';
import { useChannelPoll } from '@app/hooks/useChannelPoll';
import { useChannelPrediction } from '@app/hooks/useChannelPrediction';
import { useOnAppStateChange } from '@app/hooks/useOnAppStateChange';
import { twitchService } from '@app/services/twitch-service';
import { addCreatedClip } from '@app/store/createdClips/actions/createdClips';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { subscribeLiveSync } from '@app/store/stream/liveSyncBus';
import { setMeasuredVideoLatencySeconds } from '@app/store/stream/videoLatency';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { logger } from '@app/utils/logger';
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';

import { ChatLatencyPill } from './ChatLatencyPill';
import { clampLandscapeChatWidth } from './liveStreamLayout/clampLandscapeChatWidth';
import { getLandscapeChatWidthBounds } from './liveStreamLayout/getLandscapeChatWidthBounds';
import { getLiveStreamChatDimensions } from './liveStreamLayout/getLiveStreamChatDimensions';
import { getLiveStreamLayoutMetrics } from './liveStreamLayout/getLiveStreamLayoutMetrics';
import { getLiveStreamVideoDimensions } from './liveStreamLayout/getLiveStreamVideoDimensions';
import {
  getNextChatCycleAction,
  type LandscapeChatCycleAction,
} from './liveStreamLayout/getNextChatCycleAction';
import {
  initialLiveStreamScreenState,
  liveStreamScreenReducer,
} from './liveStreamScreenReducer';
import { showSleepTimerMenu } from './showSleepTimerMenu';
import { useSleepTimer } from './useSleepTimer';

interface LiveStreamScreenProps {
  id: string;
}

const isAndroid = process.env.EXPO_OS === 'android';

const LANDSCAPE_CHAT_RESIZE_ACTIVATION_DISTANCE = 6;
const LANDSCAPE_CHAT_RESIZE_FAIL_DISTANCE = 12;
const LANDSCAPE_CHAT_DIVIDER_RESTING_OPACITY = 0.55;

// Hold the screen awake while watching so playback isn't interrupted by the
// idle-timer auto-lock - which kicks in aggressively under Low Power Mode.
const KEEP_AWAKE_TAG = 'live-stream';

const LANDSCAPE_CHAT_CONTROLS_TOP_OFFSET = 60;
const CHAT_CONNECTION_FALLBACK_MS = 10_000;
const CHAT_TOGGLE_DEBOUNCE_MS = 450;

const LANDSCAPE_CHAT_CLOSE_WIDTH_FRACTION = 0.55;
const LANDSCAPE_CHAT_CLOSE_VELOCITY = 900;

const RESIZE_ANIMATION_CONFIG = {
  duration: motion.fast,
  easing: motion.easing.out,
} satisfies WithTimingConfig;

const CHAT_REVEAL_ANIMATION_CONFIG = {
  duration: motion.instant,
  easing: motion.easing.out,
} satisfies WithTimingConfig;

function handlePlaybackLatencyChange(latencySeconds: number) {
  setMeasuredVideoLatencySeconds(latencySeconds);
}

export const LiveStreamScreen = memo(function LiveStreamScreen({
  id,
}: LiveStreamScreenProps) {
  const { t } = useTranslation('stream');
  const isFocused = useIsFocused();
  const { authState } = useAuthContext();
  const customPlayerEnabled = usePreference('customPlayerEnabled');
  const streamPlayerRef = useRef<StreamPlayerRef>(null);
  useEffect(
    () => subscribeLiveSync(() => streamPlayerRef.current?.syncToLive()),
    [],
  );
  // Release the WebView video before popping so an active AVPlayer can't wedge the transition.
  const handleBack = useCallback(() => {
    streamPlayerRef.current?.releaseMedia();
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      }
    }, 120);
  }, []);
  const sleepTimer = useSleepTimer({ onExpire: handleBack });
  const handleSleepTimerPress = useCallback(() => {
    showSleepTimerMenu(sleepTimer);
  }, [sleepTimer]);
  const wasPlayingBeforeBackgroundRef = useRef(false);
  const normalizedLogin = id.trim().toLowerCase();
  const disableChat = usePreference('disableChat');
  const disableStream = usePreference('disableStream');
  const persistedLandscapeChatWidth = usePreference('landscapeChatWidth');
  const updatePreferences = useUpdatePreferences();
  // Window dims/insets can stick in the old orientation after a rotation; fall back to the
  // native ScreenOrientation event when they do, and map the notch inset to the top.
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [deviceLandscape, setDeviceLandscape] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    const apply = (orientation: ScreenOrientation.Orientation) => {
      if (!active) {
        return;
      }
      if (
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      ) {
        setDeviceLandscape(true);
      } else if (
        orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
        orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
      ) {
        setDeviceLandscape(false);
      }
    };
    void ScreenOrientation.getOrientationAsync().then(apply);
    const subscription = ScreenOrientation.addOrientationChangeListener(event =>
      apply(event.orientationInfo.orientation),
    );
    return () => {
      active = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);
  // Follow the fast window dims, but fall back to the native event once they've
  // disagreed long enough to be clearly stuck (not just mid-rotation lag).
  const winLandscape = winW > winH;
  const [winStuck, setWinStuck] = useState(false);
  useEffect(() => {
    if (deviceLandscape === null || deviceLandscape === winLandscape) {
      setWinStuck(false);
      return;
    }
    const timer = setTimeout(() => setWinStuck(true), 350);
    return () => clearTimeout(timer);
  }, [deviceLandscape, winLandscape]);
  const oriLandscape =
    winStuck && deviceLandscape !== null ? deviceLandscape : winLandscape;
  const sideLong = Math.max(winW, winH);
  const sideShort = Math.min(winW, winH);
  const notchInset = Math.max(insets.top, insets.left, insets.right);
  const { isLandscape, layoutHeight, portraitTopInset, screenWidth } =
    getLiveStreamLayoutMetrics({
      insetTop: notchInset,
      windowHeight: oriLandscape ? sideShort : sideLong,
      windowWidth: oriLandscape ? sideLong : sideShort,
    });

  /**
   * In landscape the notch / Dynamic Island sits on one horizontal edge and
   * the home indicator on the other, so the safe-area insets land on left and
   * right rather than top. Reserve that space so video and chat controls never
   * slide under the Dynamic Island.
   */
  const landscapeInsetLeft = isLandscape ? insets.left : 0;
  const landscapeInsetRight = isLandscape ? insets.right : 0;
  const contentWidth = Math.max(
    1,
    screenWidth - landscapeInsetLeft - landscapeInsetRight,
  );
  const isChatEnabled = !disableChat;
  const isStreamEnabled = !disableStream;
  const [uiState, dispatchUi] = useReducer(
    liveStreamScreenReducer,
    persistedLandscapeChatWidth,
    seedWidth => ({
      ...initialLiveStreamScreenState,
      landscapeChatWidth: seedWidth,
    }),
  );
  const {
    fullscreenChatMode,
    isChatConnectionReady,
    isChatVisible,
    landscapeChatCycleAction,
    landscapeChatWidth,
  } = uiState;
  const isChatVisibleForLayout = isChatVisible || !isStreamEnabled;
  const shouldRenderChat =
    isChatEnabled && (!isLandscape || isChatVisibleForLayout);
  const lastChatToggleTimeRef = useRef<number>(0);
  const previousIsLandscapeRef = useRef(isLandscape);
  const isStreamEnabledRef = useRef(isStreamEnabled);
  isStreamEnabledRef.current = isStreamEnabled;

  useFocusEffect(
    useCallback(() => {
      void ScreenOrientation.unlockAsync();
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      // Resume on refocus (the blur cleanup pauses the player); a no-op on cold mount.
      streamPlayerRef.current?.play();
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
        void ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
        streamPlayerRef.current?.pause();
        setMeasuredVideoLatencySeconds(null);
        if (isStreamEnabledRef.current) {
          dispatchUi({
            type: 'setChatConnectionReady',
            isChatConnectionReady: false,
          });
        }
      };
    }, [dispatchUi]),
  );

  /**
   * Pauses the player when the app is backgrounded and resumes it on return,
   * but only for a *full* background.
   *
   * `inactive` fires for transient interruptions (Control Center / notification
   * pulldown, call banner, Face ID, app-switcher peek) that don't background the
   * app - pausing on those left the player stopped with nothing to resume it,
   * which read as the intermittent pausing this effect fixes. The pre-background
   * play state is captured so a player the user had already paused stays paused
   * on resume.
   */
  useOnAppStateChange(({ current }) => {
    const player = streamPlayerRef.current;
    if (!player) {
      return;
    }
    // An active picture-in-picture window is exactly the case where playback
    // should continue in the background, so leave the player alone.
    if (player.isPictureInPicture()) {
      wasPlayingBeforeBackgroundRef.current = false;
      return;
    }
    if (current === 'background') {
      wasPlayingBeforeBackgroundRef.current = !player.getPaused();
      player.pause();
    } else if (current === 'active') {
      if (wasPlayingBeforeBackgroundRef.current) {
        player.play();
      }
      wasPlayingBeforeBackgroundRef.current = false;
    }
  });

  const commitLandscapeChatWidth = useCallback(
    (width: number) => {
      const clampedWidth = clampLandscapeChatWidth(
        width,
        contentWidth,
        fullscreenChatMode,
      );
      dispatchUi({
        type: 'setLandscapeChatWidth',
        landscapeChatWidth: clampedWidth,
      });
      // Persist so the chosen width survives leaving the screen / relaunch.
      updatePreferences({ landscapeChatWidth: clampedWidth });
    },
    [contentWidth, fullscreenChatMode, dispatchUi, updatePreferences],
  );

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
    [dispatchUi],
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

  const closeLandscapeChatBySwipe = useCallback(() => {
    applyLandscapeChatCycleAction('hide');
  }, [applyLandscapeChatCycleAction]);

  const streamSessionKey = `${isStreamEnabled}:${normalizedLogin ?? ''}`;
  const lastStreamSessionKeyRef = useRef(streamSessionKey);

  useLayoutEffect(() => {
    if (lastStreamSessionKeyRef.current !== streamSessionKey) {
      lastStreamSessionKeyRef.current = streamSessionKey;
      setMeasuredVideoLatencySeconds(null);
      dispatchUi({
        type: 'setChatConnectionReady',
        isChatConnectionReady: !isStreamEnabled,
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

  const shouldResolveChannelIdentity = isChatEnabled || isStreamEnabled;
  const shouldFetchChannelMetadata = isFocused && normalizedLogin.length > 0;
  const { data: stream } = useStreamQuery(normalizedLogin, {
    enabled: isStreamEnabled && shouldFetchChannelMetadata,
  });

  const { data: user } = useUserQuery(normalizedLogin, {
    enabled:
      shouldResolveChannelIdentity &&
      shouldFetchChannelMetadata &&
      (!isStreamEnabled || !stream?.user_id),
  });

  // Memoised so the resize effect below only re-runs when a dimension actually changes,
  // not on every unrelated re-render.
  const videoDimensions = useMemo(
    () =>
      getLiveStreamVideoDimensions({
        fullscreenChatMode,
        isChatEnabled,
        isChatVisible,
        isLandscape,
        landscapeChatWidth,
        layoutHeight,
        isStreamEnabled,
        screenWidth: contentWidth,
      }),
    [
      fullscreenChatMode,
      isChatEnabled,
      isChatVisible,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      isStreamEnabled,
      contentWidth,
    ],
  );

  const chatDimensions = useMemo(
    () =>
      getLiveStreamChatDimensions({
        fullscreenChatMode,
        isChatEnabled,
        isLandscape,
        landscapeChatWidth,
        layoutHeight,
        isStreamEnabled,
        screenWidth: contentWidth,
      }),
    [
      fullscreenChatMode,
      isChatEnabled,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      isStreamEnabled,
      contentWidth,
    ],
  );

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
  const resizeHandleOpacity = useSharedValue(
    LANDSCAPE_CHAT_DIVIDER_RESTING_OPACITY,
  );
  // Layout inputs mirrored as shared values so the animated styles read one set the effect
  // updates atomically - reading JS values directly caused a one-frame rotation flicker.
  const landscapeSV = useSharedValue(isLandscape ? 1 : 0);
  const insetLeftSV = useSharedValue(landscapeInsetLeft);
  const topInsetSV = useSharedValue(portraitTopInset);
  const contentWidthSV = useSharedValue(contentWidth);

  const animatedChatStyle = useAnimatedStyle(() => ({
    height: chatHeight.get(),
    left:
      landscapeSV.get() > 0.5
        ? insetLeftSV.get() +
          Math.max(0, contentWidthSV.get() - chatWidth.get())
        : 0,
    opacity: chatOpacity.get(),
    top: landscapeSV.get() > 0.5 ? 0 : topInsetSV.get() + videoHeight.get(),
    transform: [{ translateX: chatTranslateX.get() }],
    width: chatWidth.get(),
  }));

  useLayoutEffect(() => {
    const orientationChanged = previousIsLandscapeRef.current !== isLandscape;

    previousIsLandscapeRef.current = isLandscape;

    // Snap position inputs in the same pass as the dimensions to avoid a rotation flicker.
    landscapeSV.set(isLandscape ? 1 : 0);
    insetLeftSV.set(landscapeInsetLeft);
    topInsetSV.set(portraitTopInset);
    contentWidthSV.set(contentWidth);

    if (orientationChanged) {
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

      // Chat is only hidden in landscape; in portrait always show it. Snap straight to place
      // on rotation (no reveal) - the old rAF fade made rapid rotation crawl over several frames.
      if (!isLandscapeChatHidden) {
        chatOpacity.set(1);
        chatTranslateX.set(0);
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

    if (!isLandscapeChatHidden) {
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
    isLandscapeChatHidden,
    landscapeInsetLeft,
    portraitTopInset,
    contentWidth,
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
    landscapeSV,
    insetLeftSV,
    topInsetSV,
    contentWidthSV,
  ]);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    height: videoHeight.get(),
    left: insetLeftSV.get(),
    top: topInsetSV.get(),
    width: videoWidth.get(),
  }));

  const animatedFullscreenControlsStyle = useAnimatedStyle(() => ({
    right: theme.space16 + landscapeInsetRight + chatWidth.get(),
  }));

  const animatedResizeHandleStyle = useAnimatedStyle(() => ({
    opacity: resizeHandleOpacity.get(),
  }));

  const resizeChatGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([
          -LANDSCAPE_CHAT_RESIZE_ACTIVATION_DISTANCE,
          LANDSCAPE_CHAT_RESIZE_ACTIVATION_DISTANCE,
        ])
        .failOffsetY([
          -LANDSCAPE_CHAT_RESIZE_FAIL_DISTANCE,
          LANDSCAPE_CHAT_RESIZE_FAIL_DISTANCE,
        ])
        .onBegin(() => {
          resizeStartWidth.set(chatWidth.get());
          resizeHandleOpacity.set(1);
        })
        .onUpdate(event => {
          const { maxWidth } = getLandscapeChatWidthBounds(
            contentWidth,
            fullscreenChatMode,
          );
          const nextWidth = Math.min(
            maxWidth,
            Math.max(0, resizeStartWidth.get() - event.translationX),
          );

          chatWidth.set(nextWidth);
          if (fullscreenChatMode === 'sidebar' && isChatVisibleForLayout) {
            videoWidth.set(Math.max(1, contentWidth - nextWidth));
          }
        })
        .onEnd(event => {
          const { minWidth } = getLandscapeChatWidthBounds(
            contentWidth,
            fullscreenChatMode,
          );
          const closeWidth = minWidth * LANDSCAPE_CHAT_CLOSE_WIDTH_FRACTION;
          const width = chatWidth.get();
          if (
            width < closeWidth ||
            event.velocityX > LANDSCAPE_CHAT_CLOSE_VELOCITY
          ) {
            scheduleOnRN(closeLandscapeChatBySwipe);
            return;
          }

          const committedWidth = Math.max(minWidth, width);
          chatWidth.set(withTiming(committedWidth, RESIZE_ANIMATION_CONFIG));
          if (fullscreenChatMode === 'sidebar' && isChatVisibleForLayout) {
            videoWidth.set(
              withTiming(
                Math.max(1, contentWidth - committedWidth),
                RESIZE_ANIMATION_CONFIG,
              ),
            );
          }
          scheduleOnRN(commitLandscapeChatWidth, committedWidth);
        })
        .onFinalize(() => {
          resizeHandleOpacity.set(LANDSCAPE_CHAT_DIVIDER_RESTING_OPACITY);
        }),
    [
      fullscreenChatMode,
      contentWidth,
      isChatVisibleForLayout,
      closeLandscapeChatBySwipe,
      commitLandscapeChatWidth,
      chatWidth,
      videoWidth,
      resizeStartWidth,
      resizeHandleOpacity,
    ],
  );

  const contentContainerStyle = styles.contentContainer;

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

  // Matches the media-layout live-stream card's request size so the loading
  // poster is an instant cache hit when arriving from the stream list.
  const posterUrl = useMemo(
    () =>
      stream?.thumbnail_url
        ? stream.thumbnail_url
            .replace('{width}', MEDIA_THUMBNAIL_SIZE.width)
            .replace('{height}', MEDIA_THUMBNAIL_SIZE.height)
        : undefined,
    [stream?.thumbnail_url],
  );

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

  const isCreatingClipRef = useRef(false);
  const canCreateClip = Boolean(
    authState?.isLoggedIn && !authState.isAnonAuth && resolvedChannelId,
  );
  const handleCreateClipPress = useCallback(() => {
    if (!resolvedChannelId || isCreatingClipRef.current) {
      return;
    }
    isCreatingClipRef.current = true;
    void twitchService
      .createClip(resolvedChannelId)
      .then(clip => {
        if (!clip) {
          toast.error(t('clipUnavailable'));
          return;
        }
        addCreatedClip({
          id: clip.id,
          broadcasterLogin: resolvedChannelLogin ?? '',
          broadcasterName:
            stream?.user_name ??
            user?.display_name ??
            resolvedChannelLogin ??
            '',
          createdAt: Date.now(),
        });
        toast.success(t('clipCreated'), {
          action: {
            label: t('editClip'),
            onClick: () => openLinkInBrowser(clip.edit_url),
          },
        });
      })
      .catch((error: unknown) => {
        logger.twitch.warn('Failed to create clip', {
          error,
          channel_id: resolvedChannelId,
        });
        toast.error(t('clipCreateFailed'));
      })
      .finally(() => {
        isCreatingClipRef.current = false;
      });
  }, [
    resolvedChannelId,
    resolvedChannelLogin,
    stream?.user_name,
    user?.display_name,
    t,
  ]);

  return (
    <View style={contentContainerStyle}>
      <StatusBar style='light' />
      <Animated.View
        testID='stream-player-container'
        style={[styles.videoContainer, animatedVideoStyle]}
      >
        {shouldRenderStreamPlayer ? (
          <StreamPlayer
            ref={streamPlayerRef}
            channel={resolvedChannelLogin}
            height='100%'
            width='100%'
            autoplay
            muted={false}
            showOverlayControls={customPlayerEnabled}
            onBackPress={customPlayerEnabled ? handleBack : undefined}
            onPlay={handlePlayerLoaded}
            onPlaybackLatencyChange={handlePlaybackLatencyChange}
            onReady={handlePlayerLoaded}
            onCreateClipPress={
              canCreateClip ? handleCreateClipPress : undefined
            }
            onSharePress={resolvedChannelLogin ? handleSharePress : undefined}
            onSleepTimerPress={handleSleepTimerPress}
            sleepTimerActive={sleepTimer.isActive}
            onVideoAreaPress={isLandscape ? cycleLandscapeChatMode : undefined}
            onVideoAreaSwipeDown={isLandscape ? handleExitLandscape : undefined}
            onWebViewLoaded={handlePlayerLoaded}
            posterUrl={posterUrl}
            streamInfo={streamInfo}
          />
        ) : null}

        {isAndroid && !customPlayerEnabled ? (
          <Button
            label={t('goBack')}
            onPress={handleBack}
            style={styles.androidBackButton}
          >
            <SymbolView
              name={{
                ios: 'chevron.left',
                android: 'arrow_back',
                web: 'arrow_back',
              }}
              size={22}
              tintColor={theme.colorWhite}
            />
          </Button>
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
              {isStreamEnabled && customPlayerEnabled ? (
                <ChatLatencyPill />
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
                accessibilityLabel={t('resizeChat')}
                accessibilityRole='adjustable'
                style={[styles.chatResizeHandle, animatedResizeHandleStyle]}
              >
                <View style={styles.chatResizeDividerLine} />
                <View style={styles.chatResizeGrip}>
                  <View style={styles.chatResizeIndicator} />
                </View>
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
            { top: insets.top + LANDSCAPE_CHAT_CONTROLS_TOP_OFFSET },
            animatedFullscreenControlsStyle,
          ]}
        >
          <Button
            label={isChatVisible ? t('hideChat') : t('showChat')}
            onPress={toggleChat}
            style={styles.fullscreenChatControlButton}
          >
            <SymbolView
              tintColor={theme.colorWhite}
              name={isChatVisible ? 'eye.slash' : 'message'}
              size={14}
              style={styles.fullscreenChatControlIcon}
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
              size={14}
              style={styles.fullscreenChatControlIcon}
            />
          </Button>
        </Animated.View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  androidBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: theme.borderRadius999,
    height: 40,
    justifyContent: 'center',
    left: theme.space12,
    position: 'absolute',
    top: theme.space8,
    width: 40,
    zIndex: 12,
  },
  chatContainer: {
    backgroundColor: theme.colorBlack,
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
    width: 30,
    zIndex: 8,
  },
  chatResizeDividerLine: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  chatResizeGrip: {
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,22,0.74)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 52,
    justifyContent: 'center',
    width: 16,
  },
  chatResizeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: theme.borderRadius999,
    height: 26,
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
    backgroundColor: theme.colorBlack,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  fullscreenChatControlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  fullscreenChatControlIcon: {
    opacity: 0.75,
  },
  fullscreenChatControls: {
    flexDirection: 'row',
    gap: theme.space8,
    position: 'absolute',
    zIndex: 12,
  },
  videoContainer: {
    alignItems: 'center',
    backgroundColor: theme.colorBlack,
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  videoUser: {
    color: theme.colorWhite,
    fontSize: theme.fontSize16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
});
