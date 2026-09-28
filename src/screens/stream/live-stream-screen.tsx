import { memo, useCallback, useEffect, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { router, Stack, useIsFocused } from 'expo-router';

import type { StreamPlayerRef } from '@app/components/stream-player/types';
import { useAuthContext } from '@app/context/auth-context';
import { useChannelPoll } from '@app/hooks/use-channel-poll';
import { useChannelPrediction } from '@app/hooks/use-channel-prediction';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import {
  streamQueryOptions,
  userQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { subscribeLiveSync } from '@app/store/stream/live-sync-bus';
import { setMeasuredVideoLatencySeconds } from '@app/store/stream/video-latency';
import { theme } from '@app/styles/themes';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';

import { LandscapeChatControls } from './components/landscape-chat-controls';
import { LiveStreamChatPane } from './components/live-stream-chat-pane';
import { LiveStreamVideoPane } from './components/live-stream-video-pane';
import { useChatConnectionReadiness } from './hooks/use-chat-connection-readiness';
import { useLiveStreamActions } from './hooks/use-live-stream-actions';
import { useLiveStreamAnimatedLayout } from './hooks/use-live-stream-animated-layout';
import { useLiveStreamChatControls } from './hooks/use-live-stream-chat-controls';
import { useLiveStreamDimensions } from './hooks/use-live-stream-dimensions';
import { useLiveStreamOrientation } from './hooks/use-live-stream-orientation';
import { useLiveStreamPlayerLifecycle } from './hooks/use-live-stream-player-lifecycle';
import { useLiveStreamPlayerProps } from './hooks/use-live-stream-player-props';
import { useSleepTimer } from './hooks/use-sleep-timer';
import { getLiveStreamVisibility } from './util/get-live-stream-visibility';
import {
  initialLiveStreamScreenState,
  liveStreamScreenReducer,
} from './util/live-stream-screen-reducer';
import { resolveChannelIdentity } from './util/resolve-channel-identity';
import { showSleepTimerMenu } from './util/show-sleep-timer-menu';

interface LiveStreamScreenProps {
  id: string;
}

// Keep the screen awake while watching; auto-lock is aggressive under Low Power Mode.

const LANDSCAPE_CHAT_CONTROLS_TOP_OFFSET = 60;

function handlePlaybackLatencyChange(latencySeconds: number) {
  setMeasuredVideoLatencySeconds(latencySeconds);
}

export const LiveStreamScreen = memo(function LiveStreamScreen({
  id,
}: LiveStreamScreenProps) {
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

  const normalizedLogin = normaliseChatUsername(id);
  const disableChat = usePreference('disableChat');
  const disableStream = usePreference('disableStream');
  const persistedLandscapeChatWidth = usePreference('landscapeChatWidth');
  const updatePreferences = useUpdatePreferences();

  const {
    contentWidth,
    insets,
    isLandscape,
    landscapeInsetLeft,
    landscapeInsetRight,
    layoutHeight,
    portraitTopInset,
  } = useLiveStreamOrientation();

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

  const previousIsLandscapeRef = useRef(isLandscape);
  const isStreamEnabledRef = useSyncRef(isStreamEnabled);

  const handleChatConnectionLost = useCallback(() => {
    if (isStreamEnabledRef.current) {
      dispatchUi({
        type: 'setChatConnectionReady',
        isChatConnectionReady: false,
      });
    }
  }, [dispatchUi, isStreamEnabledRef]);

  useLiveStreamPlayerLifecycle({
    onChatConnectionLost: handleChatConnectionLost,
    streamPlayerRef,
  });

  const {
    closeLandscapeChatBySwipe,
    commitLandscapeChatWidth,
    cycleLandscapeChatMode,
    handleExitLandscape,
    landscapeChatContainerStyle,
    toggleChat,
    toggleFullscreenChatMode,
  } = useLiveStreamChatControls({
    contentWidth,
    dispatchUi,
    fullscreenChatMode,
    isChatVisible,
    isLandscape,
    landscapeChatCycleAction,
    updatePreferences,
  });

  const handlePlayerLoaded = useChatConnectionReadiness({
    dispatchUi,
    isStreamEnabled,
    normalizedLogin,
  });

  const shouldResolveChannelIdentity = isChatEnabled || isStreamEnabled;
  const shouldFetchChannelMetadata = isFocused && normalizedLogin.length > 0;

  const {
    data: stream,
    isError: isStreamRequestError,
    isSuccess: isStreamRequestSuccess,
    refetch: refetchStream,
  } = useQuery({
    ...streamQueryOptions(normalizedLogin),
    enabled: isStreamEnabled && shouldFetchChannelMetadata,
  });

  const { data: user } = useQuery({
    ...userQueryOptions(normalizedLogin),
    enabled:
      shouldResolveChannelIdentity &&
      shouldFetchChannelMetadata &&
      (!isStreamEnabled || !stream?.user_id),
  });

  const {
    chatDimensions,
    effectiveChatHeight,
    effectiveChatWidth,
    isLandscapeChatHidden,
    videoDimensions,
  } = useLiveStreamDimensions({
    contentWidth,
    fullscreenChatMode,
    isChatEnabled,
    isChatVisible,
    isChatVisibleForLayout,
    isLandscape,
    isStreamEnabled,
    landscapeChatWidth,
    layoutHeight,
  });

  const {
    animatedChatStyle,
    animatedFullscreenControlsStyle,
    animatedResizeHandleStyle,
    animatedVideoStyle,
    resizeChatGesture,
  } = useLiveStreamAnimatedLayout({
    chatDimensions,
    closeLandscapeChatBySwipe,
    commitLandscapeChatWidth,
    contentWidth,
    effectiveChatHeight,
    effectiveChatWidth,
    fullscreenChatMode,
    isChatVisibleForLayout,
    isLandscape,
    isLandscapeChatHidden,
    landscapeInsetLeft,
    landscapeInsetRight,
    portraitTopInset,
    previousIsLandscapeRef,
    videoDimensions,
  });

  const contentContainerStyle = styles.contentContainer;

  const {
    broadcasterName,
    displayName,
    profileImageUrl,
    resolvedChannelId,
    resolvedChannelLogin,
  } = resolveChannelIdentity({ normalizedLogin, stream, user });

  const {
    isChannelOffline,
    isStreamUnavailable,
    predictionChannelId,
    shouldMountChat,
    shouldRenderChatPanel,
    shouldRenderStreamPlayer,
    shouldShowChatConnectionNotice,
  } = getLiveStreamVisibility({
    isChatConnectionReady,
    isChatEnabled,
    isFocused,
    isStreamEnabled,
    isStreamRequestError,
    isStreamRequestSuccess,
    resolvedChannelId,
    resolvedChannelLogin,
    shouldRenderChat,
    stream,
  });

  const shouldRenderLandscapeChatControls =
    isStreamEnabled && isChatEnabled && isLandscape;

  const { prediction } = useChannelPrediction(predictionChannelId);
  const { poll } = useChannelPoll(predictionChannelId);

  const { posterUrl, streamInfo } = useLiveStreamPlayerProps({
    isStreamEnabled,
    resolvedChannelLogin,
    stream,
    user,
  });

  const { canCreateClip, handleCreateClipPress, handleSharePress } =
    useLiveStreamActions({
      authState,
      broadcasterName,
      resolvedChannelId,
      resolvedChannelLogin,
    });

  return (
    <View style={contentContainerStyle}>
      <Stack.Screen options={{ autoHideHomeIndicator: isLandscape }} />
      <LiveStreamVideoPane
        animatedStyle={animatedVideoStyle}
        canCreateClip={canCreateClip}
        customPlayerEnabled={customPlayerEnabled}
        displayName={displayName}
        isChannelOffline={isChannelOffline}
        isLandscape={isLandscape}
        isStreamUnavailable={isStreamUnavailable}
        onBackPress={handleBack}
        onCreateClipPress={handleCreateClipPress}
        onExitLandscape={handleExitLandscape}
        onPlaybackLatencyChange={handlePlaybackLatencyChange}
        onPlayerLoaded={handlePlayerLoaded}
        onRetry={() => void refetchStream()}
        onSharePress={handleSharePress}
        onSleepTimerPress={handleSleepTimerPress}
        onVideoAreaPress={cycleLandscapeChatMode}
        playerRef={streamPlayerRef}
        posterUrl={posterUrl}
        profileImageUrl={profileImageUrl}
        resolvedChannelLogin={resolvedChannelLogin}
        shouldRenderStreamPlayer={shouldRenderStreamPlayer}
        sleepTimerActive={sleepTimer.isActive}
        streamInfo={streamInfo}
      />

      {shouldRenderChatPanel ? (
        <LiveStreamChatPane
          animatedResizeHandleStyle={animatedResizeHandleStyle}
          customPlayerEnabled={customPlayerEnabled}
          poll={poll}
          prediction={prediction}
          animatedStyle={animatedChatStyle}
          containerStyle={landscapeChatContainerStyle}
          fullscreenChatMode={fullscreenChatMode}
          isLandscape={isLandscape}
          isStreamEnabled={isStreamEnabled}
          resizeChatGesture={resizeChatGesture}
          resolvedChannelId={resolvedChannelId}
          resolvedChannelLogin={resolvedChannelLogin}
          shouldMountChat={shouldMountChat}
          shouldShowChatConnectionNotice={shouldShowChatConnectionNotice}
        />
      ) : null}

      {shouldRenderLandscapeChatControls ? (
        <LandscapeChatControls
          animatedStyle={animatedFullscreenControlsStyle}
          fullscreenChatMode={fullscreenChatMode}
          isChatVisible={isChatVisible}
          onToggleChat={toggleChat}
          onToggleMode={toggleFullscreenChatMode}
          topOffset={insets.top + LANDSCAPE_CHAT_CONTROLS_TOP_OFFSET}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  androidBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: theme.borderRadius999,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    width: 32,
    zIndex: 12,
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
