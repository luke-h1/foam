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
import { Text } from '@app/components/Text/Text';
import { twitchQueries } from '@app/queries/twitchQueries';
import { theme } from '@app/styles/themes';
import { useQuery } from '@tanstack/react-query';
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

interface LiveStreamScreenProps {
  id: string;
}

const CHAT_SYNC_TIMEOUT_MS = 10_000;
const CHAT_PLAYBACK_SYNC_DELAY_MS = 650;
const OVERLAY_CHAT_WIDTH = 380;

type ChatReleaseReason = 'content-gate' | 'fallback-timeout' | 'playback-sync';
type FullscreenChatMode = 'sidebar' | 'overlay';

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
  const [isChatVisible, setChatVisible] = useState<boolean>(true);
  const shouldRenderChat = !isLandscape || isChatVisible;
  const [fullscreenChatMode, setFullscreenChatMode] =
    useState<FullscreenChatMode>('sidebar');
  const [hasContentGate, setHasContentGate] = useState(false);
  const [isChatReleased, setChatReleased] = useState(false);
  const [chatReleaseReason, setChatReleaseReason] =
    useState<ChatReleaseReason | null>(null);
  const streamPlayerRef = useRef<StreamPlayerRef>(null);
  const lastChatToggleTimeRef = useRef<number>(0);
  const chatReleaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const CHAT_TOGGLE_DEBOUNCE_MS = 450;

  useEffect(() => {
    void ScreenOrientation.unlockAsync();
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const clearChatReleaseTimeout = useCallback(() => {
    if (chatReleaseTimeoutRef.current) {
      clearTimeout(chatReleaseTimeoutRef.current);
      chatReleaseTimeoutRef.current = null;
    }
  }, []);

  const releaseChat = useCallback(
    (reason: ChatReleaseReason) => {
      clearChatReleaseTimeout();
      setChatReleaseReason(previous =>
        previous === reason ? previous : reason,
      );
      setChatReleased(prev => (prev ? prev : true));
    },
    [clearChatReleaseTimeout],
  );

  const scheduleChatRelease = useCallback(
    (delayMs: number, reason: ChatReleaseReason) => {
      clearChatReleaseTimeout();
      chatReleaseTimeoutRef.current = setTimeout(() => {
        chatReleaseTimeoutRef.current = null;
        setChatReleaseReason(previous =>
          previous === reason ? previous : reason,
        );
        setChatReleased(true);
      }, delayMs);
    },
    [clearChatReleaseTimeout],
  );

  const handleContentGateChange = useCallback(
    (hasGate: boolean) => {
      setHasContentGate(prev => (prev === hasGate ? prev : hasGate));
      if (hasGate) {
        releaseChat('content-gate');
      }
    },
    [releaseChat],
  );

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
    setChatReleased(false);
    setChatReleaseReason(null);
    clearChatReleaseTimeout();
    return () => {
      clearChatReleaseTimeout();
      if (__DEV__) {
        console.log('🚪 LiveStreamScreen unmounting, forcing fast cleanup...');
      }
    };
  }, [normalizedLogin, clearChatReleaseTimeout]);

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
      const videoFraction =
        isChatVisible && fullscreenChatMode === 'sidebar' ? 0.65 : 1;
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
  }, [
    fullscreenChatMode,
    hasContentGate,
    isChatVisible,
    isLandscape,
    screenHeight,
    screenWidth,
  ]);

  const getChatDimensions = useCallback(() => {
    let width: number;
    let height: number;
    if (isLandscape) {
      width =
        fullscreenChatMode === 'overlay'
          ? Math.min(OVERLAY_CHAT_WIDTH, screenWidth * 0.46)
          : screenWidth * 0.35;
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
  }, [
    fullscreenChatMode,
    hasContentGate,
    isLandscape,
    screenHeight,
    screenWidth,
  ]);

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
    () => [styles.contentContainer, isLandscape && styles.row],
    [isLandscape],
  );

  const resolvedChannelLogin =
    stream?.user_login ?? user?.login ?? normalizedLogin;
  const resolvedChannelId = stream?.user_id ?? user?.id;
  const { prediction } = useChannelPrediction(resolvedChannelId);
  const { poll } = useChannelPoll(resolvedChannelId);
  const shouldMountChat =
    shouldRenderChat &&
    Boolean(resolvedChannelLogin) &&
    Boolean(resolvedChannelId) &&
    (hasContentGate || isChatReleased);

  const handlePlayerPlay = useCallback(() => {
    scheduleChatRelease(CHAT_PLAYBACK_SYNC_DELAY_MS, 'playback-sync');
  }, [scheduleChatRelease]);

  const handlePlayerError = useCallback(() => {
    releaseChat('fallback-timeout');
  }, [releaseChat]);

  useEffect(() => {
    if (!resolvedChannelLogin || hasContentGate || isChatReleased) {
      return;
    }

    scheduleChatRelease(CHAT_SYNC_TIMEOUT_MS, 'fallback-timeout');
  }, [
    hasContentGate,
    isChatReleased,
    resolvedChannelLogin,
    scheduleChatRelease,
  ]);

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
    setFullscreenChatMode(current =>
      current === 'sidebar' ? 'overlay' : 'sidebar',
    );
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
            deferOverlayUntilUserUnmute
            height="100%"
            width="100%"
            autoplay
            muted={false}
            onContentGateChange={handleContentGateChange}
            onError={handlePlayerError}
            onPlay={handlePlayerPlay}
            onVideoAreaPress={isLandscape ? toggleChat : undefined}
            onVideoAreaSwipeDown={isLandscape ? handleExitLandscape : undefined}
            streamInfo={streamInfo}
          />
        ) : null}
        {isLandscape ? (
          <View
            style={[
              styles.fullscreenChatControls,
              { top: insets.top + theme.space12 },
            ]}
          >
            <Button
              label={isChatVisible ? 'Hide chat' : 'Show chat'}
              onPress={toggleChat}
              style={styles.fullscreenChatControlButton}
            >
              <Icon
                color={theme.colorWhite}
                icon={isChatVisible ? 'circle-off' : 'message-circle'}
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
                icon={
                  fullscreenChatMode === 'overlay'
                    ? 'panel-left'
                    : 'monitor-play'
                }
                size={16}
              />
            </Button>
          </View>
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
            {chatReleaseReason === 'fallback-timeout' ? (
              <View style={styles.chatSyncBanner}>
                <Text color="gray.contrast" type="xxs" weight="semibold">
                  Chat connected before playback.
                </Text>
                <Text color="gray.textLow" type="xxs">
                  Messages may run ahead until video starts.
                </Text>
              </View>
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
              channelId={resolvedChannelId!}
              channelName={resolvedChannelLogin!}
              transparent={isLandscape && fullscreenChatMode === 'overlay'}
            />
          </View>
        ) : shouldRenderChat && resolvedChannelLogin && resolvedChannelId ? (
          <View style={[styles.chatContent, styles.chatPlaceholder]}>
            <Text
              align="center"
              color="gray.textLow"
              testID="chat-sync-placeholder"
              type="xs"
              weight="medium"
            >
              Syncing chat to stream...
            </Text>
            <Text
              align="center"
              color="gray.accent"
              style={styles.chatPlaceholderSubtext}
              type="xxs"
            >
              Joining 10 seconds after the player appears, or 650ms after
              playback starts.
            </Text>
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
  overlayChatBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayChatContent: {
    backgroundColor: 'rgba(10, 11, 16, 0.42)',
    borderLeftColor: theme.colorBorderSecondary,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  chatPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderLeftColor: theme.colorBorderSecondary,
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: theme.space8,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  chatPlaceholderSubtext: {
    maxWidth: 220,
  },
  chatSyncBanner: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
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
    right: theme.space16,
    zIndex: 4,
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
