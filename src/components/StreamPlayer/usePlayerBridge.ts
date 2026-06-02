import { countMetric } from '@app/lib/sentry';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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
  ref: Ref<StreamPlayerRef>;
  runJavaScript: (script: string) => void;
  scheduleAuthCompletionReload: () => void;
  sourceKey: string;
  usesHostedPlayer: boolean;
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
  usesHostedPlayer,
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

  useEffect(() => {
    setPlaybackLatencySeconds(null);
    setOverlayUnlocked(false);
  }, [sourceKey]);

  useEffect(() => {
    setPlayerStatus({
      isReady: false,
      isBuffering: true,
    });
  }, [sourceKey, webViewKey]);

  useEffect(() => {
    onContentGateChange?.(hasContentGate);
  }, [hasContentGate, onContentGateChange]);

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

  const play = useCallback(() => {
    injectJS('window.playerControls.play()');
  }, [injectJS]);

  const pause = useCallback(() => {
    injectJS('window.playerControls.pause()');
  }, [injectJS]);

  const mute = useCallback(() => {
    injectJS('window.playerControls.mute()');
  }, [injectJS]);

  const unmute = useCallback(() => {
    injectJS('window.playerControls.unmute()');
  }, [injectJS]);

  const setMuted = useCallback(
    (muted: boolean) => {
      injectJS(`window.playerControls.setMuted(${muted})`);
    },
    [injectJS],
  );

  const setVolume = useCallback(
    (volume: number) => {
      injectJS(`window.playerControls.setVolume(${volume})`);
    },
    [injectJS],
  );

  const setChannel = useCallback(
    (newChannel: string) => {
      injectJS(`window.playerControls.setChannel('${newChannel}')`);
    },
    [injectJS],
  );

  const setVideo = useCallback(
    (videoId: string, timestamp?: number) => {
      injectJS(
        `window.playerControls.setVideo('${videoId}', ${timestamp ?? 0})`,
      );
    },
    [injectJS],
  );

  const setQuality = useCallback(
    (quality: string) => {
      injectJS(`window.playerControls.setQuality('${quality}')`);
    },
    [injectJS],
  );

  const seek = useCallback(
    (timestamp: number) => {
      injectJS(`window.playerControls.seek(${timestamp})`);
    },
    [injectJS],
  );

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

  useImperativeHandle(
    ref,
    () => ({
      forceRefresh,
      getChannel: () => playerState.channel,
      getCurrentTime,
      getDuration,
      getMuted: () => playerState.muted,
      getPaused: () => playerState.isPaused,
      getVolume: () => playerState.volume,
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
    }),
    [
      forceRefresh,
      getCurrentTime,
      getDuration,
      mute,
      pause,
      play,
      playerState.channel,
      playerState.isPaused,
      playerState.muted,
      playerState.volume,
      seek,
      setChannel,
      setMuted,
      setQuality,
      setVideo,
      setVolume,
      unmute,
    ],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as PlayerMessage;

        switch (message.type) {
          case 'ready':
            countMetric('stream.ready', {
              autoplay,
              component: 'StreamPlayer',
              defer_overlay_until_user_unmute: deferOverlayUntilUserUnmute,
            });
            setPlayerStatus({
              isReady: true,
              isBuffering: false,
            });
            onReady?.();
            if (!initialMuted && !deferOverlayUntilUserUnmute) {
              const unmuteDeadline = Date.now() + 5000;
              const unmuteInterval = setInterval(() => {
                unmute();
                if (Date.now() > unmuteDeadline) {
                  clearInterval(unmuteInterval);
                }
              }, 100);
            }
            break;
          case 'play':
            setPlayerState(prev => ({ ...prev, isPaused: false }));
            break;
          case 'playing':
            setPlayerState(prev => ({ ...prev, isPaused: false }));
            onPlay?.();
            break;
          case 'pause':
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
              if (
                prev.isPaused === payload.isPaused &&
                prev.muted === payload.muted &&
                prev.volume === payload.volume
              ) {
                return prev;
              }
              return {
                ...prev,
                isPaused: payload.isPaused,
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
            setHasContentGate(message.payload?.hasContentGate ?? false);
            break;
          case 'playbackBlocked':
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

            if (usesHostedPlayer) {
              const nextHasContentGate = !hasUsableLiveLatency;
              setHasContentGate(nextHasContentGate);
              onContentGateChange?.(nextHasContentGate);
            }

            if (hasUsableLiveLatency) {
              setPlaybackLatencySeconds(latency);
              onPlaybackLatencyChange?.(latency);
            } else if (usesHostedPlayer) {
              setPlaybackLatencySeconds(null);
              onPlaybackLatencyChange?.(0);
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
    },
    [
      autoplay,
      deferOverlayUntilUserUnmute,
      initialMuted,
      onEnded,
      onError,
      onOffline,
      onOnline,
      onContentGateChange,
      onPause,
      onPlaybackLatencyChange,
      onPlay,
      onReady,
      scheduleAuthCompletionReload,
      unmute,
      usesHostedPlayer,
    ],
  );

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
