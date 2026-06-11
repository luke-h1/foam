import {
  countMetric,
  recordError,
  recordInfo,
  recordWarning,
} from '@app/lib/sentry';
import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import { useImperativeHandle, useRef, useState, useCallback } from 'react';
import { useSyncRef } from '@app/hooks/useSyncRef';
import type { Ref } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';

import type {
  PlayerMessage,
  PlayerState,
  PlayerStatusState,
  StreamPlayerRef,
} from './types';

interface UsePlayerBridgeOptions {
  autoplay: boolean;
  channel?: string;
  deferOverlayUntilUserUnmute: boolean;
  forceRefresh: () => void;
  initialMuted: boolean;
  onContentGateChange?: (hasGate: boolean) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onOffline?: () => void;
  onOnline?: () => void;
  onPause?: () => void;
  onPlaybackLatencyChange?: (latencySeconds: number) => void;
  onPlay?: () => void;
  onReady?: () => void;
  ref?: Ref<StreamPlayerRef>;
  runJavaScript: (script: string) => void;
  scheduleAuthCompletionReload: () => void;
  sourceKey: string;
  webViewKey: number;
}

export function usePlayerBridge({
  autoplay,
  channel,
  deferOverlayUntilUserUnmute,
  forceRefresh,
  initialMuted,
  onContentGateChange,
  onEnded,
  onError,
  onOffline,
  onOnline,
  onPause,
  onPlaybackLatencyChange,
  onPlay,
  onReady,
  ref,
  runJavaScript,
  scheduleAuthCompletionReload,
  sourceKey,
  webViewKey,
}: UsePlayerBridgeOptions) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    channel,
    currentTime: 0,
    duration: 0,
    isPaused: !autoplay,
    muted: initialMuted,
    quality: 'auto',
    volume: 1,
  });
  const [playerStatus, setPlayerStatus] = useState<PlayerStatusState>({
    isBuffering: true,
    isReady: false,
  });
  const [hasContentGate, setHasContentGate] = useState(false);
  const [overlayUnlocked, setOverlayUnlocked] = useState(false);
  const [playbackLatencySeconds, setPlaybackLatencySeconds] = useState<
    number | null
  >(null);
  const currentTimeResolverRef = useRef<((value: number) => void) | null>(null);
  const durationResolverRef = useRef<((value: number) => void) | null>(null);
  const userPausedRef = useRef(!autoplay);
  const transientPauseResumeTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const lastPlaybackLatencySecondsRef = useRef<number | null>(null);
  // Telemetry for the current WebView/source generation: time-to-first-play
  // plus once-per-generation guards so a struggling player doesn't flood
  // Sentry with repeated blocked/stalled reports.
  const playerMountedAtRef = useRef(0);
  if (playerMountedAtRef.current === 0) {
    playerMountedAtRef.current = Date.now();
  }
  const reportedFirstPlayingRef = useRef(false);
  const reportedPlaybackBlockedRef = useRef(false);
  const [prevPlayerSource, setPrevPlayerSource] = useState({
    autoplay,
    sourceKey,
    webViewKey,
  });

  if (
    prevPlayerSource.autoplay !== autoplay ||
    prevPlayerSource.sourceKey !== sourceKey ||
    prevPlayerSource.webViewKey !== webViewKey
  ) {
    setPrevPlayerSource({ autoplay, sourceKey, webViewKey });
    setPlaybackLatencySeconds(null);
    lastPlaybackLatencySecondsRef.current = null;
    playerMountedAtRef.current = Date.now();
    reportedFirstPlayingRef.current = false;
    reportedPlaybackBlockedRef.current = false;
    setOverlayUnlocked(false);
    userPausedRef.current = !autoplay;
    setPlayerStatus({
      isReady: false,
      isBuffering: true,
    });
  }

  useUnmountCallback(() => {
    if (transientPauseResumeTimeoutRef.current) {
      clearTimeout(transientPauseResumeTimeoutRef.current);
      transientPauseResumeTimeoutRef.current = null;
    }
  });

  const onContentGateChangeRef = useSyncRef(onContentGateChange);
  const notifyContentGateChange = (nextHasContentGate: boolean) => {
    setHasContentGate(nextHasContentGate);
    onContentGateChangeRef.current?.(nextHasContentGate);
  };

  const resetPlayerStatus = useCallback(() => {
    setPlayerStatus({
      isReady: false,
      isBuffering: true,
    });
  }, []);

  const injectJS = useCallback(
    (script: string) => {
      runJavaScript(`try { ${script} } catch(e) {}; true;`);
    },
    [runJavaScript],
  );

  const resumeAfterTransientPause = useCallback(() => {
    if (!autoplay || userPausedRef.current) {
      return false;
    }

    if (!transientPauseResumeTimeoutRef.current) {
      transientPauseResumeTimeoutRef.current = setTimeout(() => {
        transientPauseResumeTimeoutRef.current = null;
        injectJS('window.playerControls.play()');
      }, 250);
    }

    return true;
  }, [autoplay, injectJS]);

  const play = useCallback(() => {
    userPausedRef.current = false;
    injectJS('window.playerControls.play()');
  }, [injectJS]);

  const pause = useCallback(() => {
    userPausedRef.current = true;
    injectJS('window.playerControls.pause()');
  }, [injectJS]);

  const mute = useCallback(() => {
    injectJS('window.playerControls.mute()');
  }, [injectJS]);

  const unmute = useCallback(() => {
    injectJS('window.playerControls.unmute()');
  }, [injectJS]);

  const setMuted = (muted: boolean) => {
    injectJS(`window.playerControls.setMuted(${muted})`);
  };

  const setVolume = (volume: number) => {
    injectJS(`window.playerControls.setVolume(${volume})`);
  };

  const setChannel = (newChannel: string) => {
    injectJS(`window.playerControls.setChannel('${newChannel}')`);
  };

  const setVideo = (videoId: string, timestamp?: number) => {
    injectJS(`window.playerControls.setVideo('${videoId}', ${timestamp ?? 0})`);
  };

  const setQuality = (quality: string) => {
    injectJS(`window.playerControls.setQuality('${quality}')`);
  };

  const seek = (timestamp: number) => {
    injectJS(`window.playerControls.seek(${timestamp})`);
  };

  const getCurrentTime = useCallback((): Promise<number> => {
    return new Promise(resolve => {
      currentTimeResolverRef.current = resolve;
      injectJS('window.playerControls.getCurrentTime()');

      setTimeout(() => {
        if (currentTimeResolverRef.current) {
          currentTimeResolverRef.current(playerState.currentTime);
          currentTimeResolverRef.current = null;
        }
      }, 1000);
    });
  }, [injectJS, playerState.currentTime]);

  const getDuration = useCallback((): Promise<number> => {
    return new Promise(resolve => {
      durationResolverRef.current = resolve;
      injectJS('window.playerControls.getDuration()');

      setTimeout(() => {
        if (durationResolverRef.current) {
          durationResolverRef.current(playerState.duration);
          durationResolverRef.current = null;
        }
      }, 1000);
    });
  }, [injectJS, playerState.duration]);

  const playerBridgeRef = useRef({
    forceRefresh,
    getCurrentTime,
    getDuration,
    mute,
    pause,
    play,
    seek,
    setChannel,
    setMuted,
    setQuality,
    setVideo,
    setVolume,
    unmute,
  });
  playerBridgeRef.current = {
    forceRefresh,
    getCurrentTime,
    getDuration,
    mute,
    pause,
    play,
    seek,
    setChannel,
    setMuted,
    setQuality,
    setVideo,
    setVolume,
    unmute,
  };
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;

  useImperativeHandle(
    ref,
    () => ({
      forceRefresh: () => playerBridgeRef.current.forceRefresh(),
      getChannel: () => playerStateRef.current.channel,
      getCurrentTime: () => playerBridgeRef.current.getCurrentTime(),
      getDuration: () => playerBridgeRef.current.getDuration(),
      getMuted: () => playerStateRef.current.muted,
      getPaused: () => playerStateRef.current.isPaused,
      getVolume: () => playerStateRef.current.volume,
      mute: () => playerBridgeRef.current.mute(),
      pause: () => playerBridgeRef.current.pause(),
      play: () => playerBridgeRef.current.play(),
      seek: timestamp => playerBridgeRef.current.seek(timestamp),
      setChannel: channelName =>
        playerBridgeRef.current.setChannel(channelName),
      setMuted: muted => playerBridgeRef.current.setMuted(muted),
      setQuality: quality => playerBridgeRef.current.setQuality(quality),
      setVideo: (videoId, timestamp) =>
        playerBridgeRef.current.setVideo(videoId, timestamp),
      setVolume: volume => playerBridgeRef.current.setVolume(volume),
      unmute: () => playerBridgeRef.current.unmute(),
    }),
    [],
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as PlayerMessage;

      switch (message.type) {
        case 'ready':
          countMetric('stream.ready', {
            autoplay,
            component: 'StreamPlayer',
            defer_overlay_until_user_unmute: deferOverlayUntilUserUnmute,
          });
          recordInfo({
            name: 'twitch_player_info',
            message: 'player ready',
            params: {
              channel,
              elapsedMs: Date.now() - playerMountedAtRef.current,
            },
          });
          setPlayerStatus({
            isReady: true,
            isBuffering: false,
          });
          onReady?.();
          break;
        case 'play':
          if (transientPauseResumeTimeoutRef.current) {
            clearTimeout(transientPauseResumeTimeoutRef.current);
            transientPauseResumeTimeoutRef.current = null;
          }
          setPlayerState(prev => ({ ...prev, isPaused: false }));
          break;
        case 'playing':
          if (transientPauseResumeTimeoutRef.current) {
            clearTimeout(transientPauseResumeTimeoutRef.current);
            transientPauseResumeTimeoutRef.current = null;
          }
          if (!reportedFirstPlayingRef.current) {
            reportedFirstPlayingRef.current = true;
            countMetric('stream.playing', {
              autoplay,
              channel: channel ?? 'unknown',
              component: 'StreamPlayer',
            });
            recordInfo({
              name: 'twitch_player_info',
              message: 'first playing',
              params: {
                channel,
                elapsedMs: Date.now() - playerMountedAtRef.current,
              },
            });
          }
          setPlayerState(prev => ({ ...prev, isPaused: false }));
          onPlay?.();
          break;
        case 'pause':
          if (resumeAfterTransientPause()) {
            break;
          }
          setPlayerState(prev => ({ ...prev, isPaused: true }));
          onPause?.();
          break;
        case 'ended':
          onEnded?.();
          break;
        case 'online':
          onOnline?.();
          break;
        case 'offline':
          onOffline?.();
          break;
        case 'stateUpdate':
          setPlayerStatus(prev => {
            const { payload } = message;
            if (
              prev.isReady === payload.isReady &&
              prev.isBuffering === payload.isBuffering
            ) {
              return prev;
            }
            return {
              isReady: payload.isReady,
              isBuffering: payload.isBuffering,
            };
          });
          setPlayerState(prev => {
            const { payload } = message;
            const isTransientAutoplayPause =
              payload.isPaused && resumeAfterTransientPause();
            if (
              prev.isPaused ===
                (isTransientAutoplayPause ? false : payload.isPaused) &&
              prev.muted === payload.muted &&
              prev.volume === payload.volume
            ) {
              return prev;
            }
            return {
              ...prev,
              isPaused: isTransientAutoplayPause ? false : payload.isPaused,
              muted: payload.muted,
              volume: payload.volume,
            };
          });
          break;
        case 'currentTime':
          if (currentTimeResolverRef.current) {
            currentTimeResolverRef.current(message.payload.time);
            currentTimeResolverRef.current = null;
          }
          break;
        case 'duration':
          if (durationResolverRef.current) {
            durationResolverRef.current(message.payload.duration);
            durationResolverRef.current = null;
          }
          break;
        case 'trace':
          if (__DEV__) {
            console.warn(
              '[StreamPlayer:embed]',
              message.payload?.step ?? '?',
              message.payload?.detail ?? '',
            );
          }
          break;
        case 'error':
          console.warn(
            '[StreamPlayer:embed ERROR]',
            message.payload?.message ?? message.payload,
          );
          onError?.(message.payload?.message ?? 'Unknown embed error');
          break;
        case 'contentGateDetected':
          notifyContentGateChange(message.payload?.hasContentGate ?? false);
          break;
        case 'playbackBlocked': {
          const errName = message.payload?.errName ?? null;
          countMetric('stream.playback_blocked', {
            channel: channel ?? 'unknown',
            err_name: errName ?? 'unknown',
          });
          // AbortError is the player core interrupting our play() while it
          // swaps sources during startup — routine, recovered automatically.
          // Anything else (NotAllowedError, NotSupportedError) means
          // playback could not start and the player is stuck on its first
          // frame; that is the report worth alerting on.
          if (errName !== 'AbortError' && !reportedPlaybackBlockedRef.current) {
            reportedPlaybackBlockedRef.current = true;
            recordWarning({
              name: 'twitch_player_warning',
              message: `playback blocked: ${errName ?? 'unknown'}`,
              params: {
                channel,
                errName,
                elapsedMs: Date.now() - playerMountedAtRef.current,
              },
            });
          }
          break;
        }
        case 'playbackStalled':
          recordError({
            name: 'twitch_player_error',
            exceptionName: 'StreamPlaybackStalled',
            message: `playback stalled for ${message.payload.stalledMs}ms`,
            fingerprint: ['stream-playback-stalled'],
            params: {
              channel,
              ...message.payload,
              elapsedMs: Date.now() - playerMountedAtRef.current,
            },
          });
          break;
        case 'playbackRecovered':
          countMetric('stream.playback_recovered', {
            channel: channel ?? 'unknown',
          });
          recordInfo({
            name: 'twitch_player_info',
            message: 'playback recovered after stall',
            params: { channel, ...message.payload },
          });
          break;
        case 'videoElementError':
          recordError({
            name: 'twitch_player_error',
            exceptionName: 'StreamVideoElementError',
            message: `video element error code ${message.payload.code ?? 'unknown'}`,
            fingerprint: ['stream-video-element-error'],
            params: {
              channel,
              ...message.payload,
              elapsedMs: Date.now() - playerMountedAtRef.current,
            },
          });
          break;
        case 'twitchAuthComplete':
          scheduleAuthCompletionReload();
          break;
        case 'playbackStats': {
          const latency = message.payload.hlsLatencyBroadcaster;
          const hasUsableLiveLatency =
            typeof latency === 'number' &&
            Number.isFinite(latency) &&
            latency > 0.25 &&
            latency < 600;

          if (hasUsableLiveLatency) {
            const previousLatency = lastPlaybackLatencySecondsRef.current;
            if (
              previousLatency == null ||
              Math.abs(previousLatency - latency) >= 0.25
            ) {
              lastPlaybackLatencySecondsRef.current = latency;
              setPlaybackLatencySeconds(latency);
              onPlaybackLatencyChange?.(latency);
            }
          }
          break;
        }
        case 'muteState': {
          const { muted: m, volume: v } = message.payload;
          setPlayerState(prev =>
            prev.muted === m && prev.volume === v
              ? prev
              : { ...prev, muted: m, volume: v },
          );
          if (deferOverlayUntilUserUnmute && m === false) {
            setOverlayUnlocked(true);
          }
          break;
        }
        default:
          break;
      }
    } catch {
      // Ignore malformed WebView messages.
    }
  };

  return {
    handleMessage,
    hasContentGate,
    overlayUnlocked,
    pause,
    play,
    playbackLatencySeconds,
    playerState,
    playerStatus,
    resetPlayerStatus,
  };
}
