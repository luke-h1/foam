import { useCallback, useImperativeHandle, useRef, useState } from 'react';
import type { Ref } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';

import i18next from 'i18next';
import { toast } from 'sonner-native';

import { useSyncRef } from '@app/hooks/useSyncRef';
import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import { countMetric } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

import {
  createStabilityRecovery,
  type StabilityRecovery,
} from './stabilityRecovery';
import type {
  PlayerMessage,
  PlayerState,
  PlayerStatusState,
  StreamPlayerRef,
} from './types';
import type { PlayerBridgeAction } from './util/playerBridgeInterpreter';
import { interpretPlayerMessage } from './util/playerBridgeInterpreter';

interface UsePlayerBridgeOptions {
  autoplay: boolean;
  channel?: string;
  deferOverlayUntilUserUnmute: boolean;
  enhancedStabilityEnabled: boolean;
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
  enhancedStabilityEnabled,
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
  const [pipActive, setPipActive] = useState(false);
  const pipActiveRef = useRef(false);
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
  const channelRef = useSyncRef(channel);
  const forceRefreshRef = useSyncRef(forceRefresh);
  const stabilityRef = useRef<StabilityRecovery | null>(null);
  if (stabilityRef.current === null) {
    stabilityRef.current = createStabilityRecovery({
      onRefresh: (reason, attempt) => {
        countMetric('stream.stability_refresh', {
          channel: channelRef.current ?? 'unknown',
          reason,
        });
        logger.main.info(`enhanced stability refresh (${reason})`, {
          name: 'twitch_player_info',
          channel: channelRef.current,
          reason,
          attempt,
        });
        forceRefreshRef.current();
      },
      onGiveUp: (reason, refreshCount) => {
        logger.main.warn(
          `enhanced stability gave up after ${refreshCount} refreshes`,
          {
            name: 'twitch_player_warning',
            channel: channelRef.current,
            reason,
          },
        );
      },
    });
  }
  const stability = stabilityRef.current;
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
    pipActiveRef.current = false;
    setPipActive(false);
    playerMountedAtRef.current = Date.now();
    reportedFirstPlayingRef.current = false;
    reportedPlaybackBlockedRef.current = false;
    stability.reset();
    setOverlayUnlocked(false);
    userPausedRef.current = !autoplay;
    setPlayerStatus({
      isReady: false,
      isBuffering: true,
    });
  }

  const clearTransientPauseResume = useCallback(() => {
    if (transientPauseResumeTimeoutRef.current) {
      clearTimeout(transientPauseResumeTimeoutRef.current);
      transientPauseResumeTimeoutRef.current = null;
    }
  }, []);

  useUnmountCallback(clearTransientPauseResume);

  const disposeStability = useCallback(() => {
    stabilityRef.current?.dispose();
  }, []);

  useUnmountCallback(disposeStability);

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

  const scheduleTransientResume = useCallback(() => {
    if (!transientPauseResumeTimeoutRef.current) {
      transientPauseResumeTimeoutRef.current = setTimeout(() => {
        transientPauseResumeTimeoutRef.current = null;
        if (userPausedRef.current) {
          return;
        }
        injectJS(
          'if (window.__foamEnsurePlaying) { window.__foamEnsurePlaying(); }' +
            'if (window.playerControls) { window.playerControls.play(); }',
        );
      }, 250);
    }
  }, [injectJS]);

  // The stock player page has no window.playerControls, so play/pause must also drive the
  // <video> directly and arm/disarm the autoplay loop.
  const play = useCallback(() => {
    userPausedRef.current = false;
    injectJS(
      'if (window.__foamEnsurePlaying) { window.__foamEnsurePlaying(); }' +
        'if (window.playerControls) { window.playerControls.play(); }',
    );
  }, [injectJS]);

  const pause = useCallback(() => {
    userPausedRef.current = true;
    clearTransientPauseResume();
    injectJS(
      'if (window.__foamStopEnsurePlaying) { window.__foamStopEnsurePlaying(); }' +
        'var v = document.querySelector("video"); if (v) { v.pause(); }' +
        'if (window.playerControls) { window.playerControls.pause(); }',
    );
  }, [clearTransientPauseResume, injectJS]);

  // Mute drives the <video> directly via __foamSetMuted; flip state optimistically and let
  // the page's volumechange confirm it.
  const applyMuted = useCallback(
    (muted: boolean) => {
      setPlayerState(prev =>
        prev.muted === muted ? prev : { ...prev, muted },
      );
      injectJS(
        `if (window.__foamSetMuted) { window.__foamSetMuted(${muted}); }` +
          ` else { var v = document.querySelector('video'); if (v) { v.muted = ${muted}; if (!${muted}) { v.volume = 1; } } }` +
          `if (window.playerControls && window.playerControls.setMuted) { window.playerControls.setMuted(${muted}); }`,
      );
    },
    [injectJS],
  );

  const mute = useCallback(() => applyMuted(true), [applyMuted]);

  const unmute = useCallback(() => applyMuted(false), [applyMuted]);

  const setMuted = (muted: boolean) => applyMuted(muted);

  const setVolume = (volume: number) => {
    injectJS(`window.playerControls.setVolume(${volume})`);
  };

  const togglePictureInPicture = useCallback(() => {
    injectJS(
      'if (window.__foamTogglePictureInPicture) { window.__foamTogglePictureInPicture(); }',
    );
  }, [injectJS]);

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
      isPictureInPicture: () => pipActiveRef.current,
      togglePictureInPicture: () => togglePictureInPicture(),
      releaseMedia: () => {
        userPausedRef.current = true;
        clearTransientPauseResume();
        injectJS(
          'if (window.__foamStopEnsurePlaying) { window.__foamStopEnsurePlaying(); }' +
            'var v = document.querySelector("video"); if (v) { try { v.pause(); v.removeAttribute("src"); v.load(); } catch(e){} }',
        );
      },
      syncToLive: () =>
        injectJS('window.__foamSyncToLive && window.__foamSyncToLive();'),
      unmute: () => playerBridgeRef.current.unmute(),
    }),
    [clearTransientPauseResume, injectJS, togglePictureInPicture],
  );

  const executeBridgeAction = (action: PlayerBridgeAction) => {
    switch (action.type) {
      case 'applyMuteState':
        setPlayerState(prev =>
          prev.muted === action.muted && prev.volume === action.volume
            ? prev
            : { ...prev, muted: action.muted, volume: action.volume },
        );
        break;
      case 'applyStateUpdate':
        setPlayerState(prev =>
          prev.isPaused === action.isPaused &&
          prev.muted === action.muted &&
          prev.volume === action.volume
            ? prev
            : {
                ...prev,
                isPaused: action.isPaused,
                muted: action.muted,
                volume: action.volume,
              },
        );
        break;
      case 'cancelTransientResume':
        clearTransientPauseResume();
        break;
      case 'countMetric':
        countMetric(action.name, action.attributes);
        break;
      case 'log':
        if (action.level === 'debug') {
          logger.main.debug(action.message, ...action.args);
        } else if (action.level === 'info') {
          logger.main.info(action.message, ...action.args);
        } else if (action.level === 'warn') {
          logger.main.warn(action.message, ...action.args);
        } else {
          logger.main.error(action.message, ...action.args);
        }
        break;
      case 'markFirstPlayingReported':
        reportedFirstPlayingRef.current = true;
        break;
      case 'markPlaybackBlockedReported':
        reportedPlaybackBlockedRef.current = true;
        break;
      case 'notifyEnded':
        onEnded?.();
        break;
      case 'notifyError':
        onError?.(action.message);
        break;
      case 'notifyOffline':
        onOffline?.();
        break;
      case 'notifyOnline':
        onOnline?.();
        break;
      case 'notifyPause':
        onPause?.();
        break;
      case 'notifyPlay':
        onPlay?.();
        break;
      case 'notifyReady':
        onReady?.();
        break;
      case 'notifyStability':
        if (action.event === 'playing') {
          stability.notePlaying();
        } else if (action.event === 'recovered') {
          stability.noteRecovered();
        } else if (action.event === 'stalled') {
          stability.noteStalled();
        } else {
          stability.noteVideoError();
        }
        break;
      case 'notifyStabilityLatency':
        stability.noteLatency(action.latencySeconds);
        break;
      case 'publishLatency':
        lastPlaybackLatencySecondsRef.current = action.latencySeconds;
        setPlaybackLatencySeconds(action.latencySeconds);
        onPlaybackLatencyChange?.(action.latencySeconds);
        break;
      case 'resolveCurrentTime':
        if (currentTimeResolverRef.current) {
          currentTimeResolverRef.current(action.seconds);
          currentTimeResolverRef.current = null;
        }
        break;
      case 'resolveDuration':
        if (durationResolverRef.current) {
          durationResolverRef.current(action.seconds);
          durationResolverRef.current = null;
        }
        break;
      case 'scheduleAuthCompletionReload':
        scheduleAuthCompletionReload();
        break;
      case 'scheduleTransientResume':
        scheduleTransientResume();
        break;
      case 'setContentGate':
        notifyContentGateChange(action.hasContentGate);
        break;
      case 'setPaused':
        setPlayerState(prev => ({ ...prev, isPaused: action.isPaused }));
        break;
      case 'setPipActive':
        pipActiveRef.current = action.active;
        setPipActive(action.active);
        break;
      case 'setPlayerReady':
        setPlayerStatus({
          isReady: true,
          isBuffering: false,
        });
        break;
      case 'setPlayerStatus':
        setPlayerStatus(prev =>
          prev.isReady === action.isReady &&
          prev.isBuffering === action.isBuffering
            ? prev
            : { isReady: action.isReady, isBuffering: action.isBuffering },
        );
        break;
      case 'showPipUnavailableToast':
        toast.error(i18next.t('stream:pictureInPictureUnavailable'));
        break;
      case 'unlockOverlay':
        setOverlayUnlocked(true);
        break;
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as PlayerMessage;
      const actions = interpretPlayerMessage(message, {
        autoplay,
        channel,
        deferOverlayUntilUserUnmute,
        enhancedStabilityEnabled,
        lastPublishedLatencySeconds: lastPlaybackLatencySecondsRef.current,
        mountedAtMs: playerMountedAtRef.current,
        nowMs: Date.now(),
        reportedFirstPlaying: reportedFirstPlayingRef.current,
        reportedPlaybackBlocked: reportedPlaybackBlockedRef.current,
        userPaused: userPausedRef.current,
      });
      for (const action of actions) {
        executeBridgeAction(action);
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
    pipActive,
    play,
    playbackLatencySeconds,
    playerState,
    playerStatus,
    resetPlayerStatus,
    setMuted,
    togglePictureInPicture,
  };
}
