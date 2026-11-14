import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { Ref, RefObject } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';

import { toast } from 'sonner-native';

import { useLazyRef } from '@app/hooks/use-lazy-ref';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import { useUnmountCallback } from '@app/hooks/use-unmount-callback';
import { countMetric } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

import type {
  PlayerState,
  PlayerStatusState,
  StreamPlayerProps,
  StreamPlayerRef,
} from '../types';
import type { PlayerBridgeAction } from '../util/playerBridgeInterpreter';
import {
  interpretPlayerMessage,
  parsePlayerMessage,
} from '../util/playerBridgeInterpreter';
import {
  createPlayerTelemetry,
  type PlayerContentKind,
} from '../util/playerTelemetry';
import { createStabilityRecovery } from '../util/stabilityRecovery';

interface BridgePlaybackUi {
  overlayUnlocked: boolean;
  pipActive: boolean;
  status: PlayerStatusState;
}

const INITIAL_BRIDGE_PLAYBACK_UI: BridgePlaybackUi = {
  overlayUnlocked: false,
  pipActive: false,
  status: { isBuffering: true, isReady: false },
};

interface UsePlayerBridgeOptions extends Pick<
  StreamPlayerProps,
  'onPlaybackLatencyChange' | 'onPlay' | 'onReady'
> {
  autoplay: boolean;
  channel?: string;
  clip?: string;
  contentKind: PlayerContentKind;
  deferOverlayUntilUserUnmute: boolean;
  enhancedStabilityEnabled: boolean;
  forceRefresh: () => void;
  initialMuted: boolean;
  ref?: Ref<StreamPlayerRef>;

  resumeTimeRef: RefObject<number>;
  runJavaScript: (script: string) => void;
  scheduleAuthCompletionReload: () => void;
  sourceKey: string;
  video?: string;
  webViewKey: number;
}

function assertUnreachableAction(action: never): never {
  throw new Error(`Unhandled PlayerBridgeAction: ${JSON.stringify(action)}`);
}

export function usePlayerBridge({
  autoplay,
  channel,
  clip,
  contentKind,
  deferOverlayUntilUserUnmute,
  enhancedStabilityEnabled,
  forceRefresh,
  initialMuted,
  onPlaybackLatencyChange,
  onPlay,
  onReady,
  ref,
  resumeTimeRef,
  runJavaScript,
  scheduleAuthCompletionReload,
  sourceKey,
  video,
  webViewKey,
}: UsePlayerBridgeOptions) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPaused: !autoplay,
    muted: initialMuted,
  });

  const [playbackUi, setPlaybackUi] = useState<BridgePlaybackUi>(
    INITIAL_BRIDGE_PLAYBACK_UI,
  );

  const [hasContentGate, setHasContentGate] = useState(false);
  const pipActiveRef = useRef(false);
  const userPausedRef = useRef(!autoplay);

  const transientPauseResumeTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const lastPlaybackLatencySecondsRef = useRef<number | null>(null);

  const playerMountedAtRef = useLazyRef(() => Date.now());

  const reportedFirstPlayingRef = useRef(false);
  const channelRef = useSyncRef(channel);
  const forceRefreshRef = useSyncRef(forceRefresh);

  const stabilityRefreshPendingRef = useRef(false);

  const [stability] = useState(() =>
    createStabilityRecovery({
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

        stabilityRefreshPendingRef.current = true;
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
    }),
  );

  const [telemetry] = useState(createPlayerTelemetry);
  const loadKey = `${sourceKey}:${webViewKey}`;
  const previousPlayerSourceRef = useRef({ autoplay, sourceKey, webViewKey });

  useLayoutEffect(() => {
    telemetry.beginLoad({
      autoplay,
      channel,
      clip,
      contentKind,
      video,
    });
  }, [autoplay, channel, clip, contentKind, loadKey, telemetry, video]);

  useLayoutEffect(() => {
    const previousPlayerSource = previousPlayerSourceRef.current;

    if (
      previousPlayerSource.autoplay === autoplay &&
      previousPlayerSource.sourceKey === sourceKey &&
      previousPlayerSource.webViewKey === webViewKey
    ) {
      return;
    }

    const sourceChanged = previousPlayerSource.sourceKey !== sourceKey;

    previousPlayerSourceRef.current = { autoplay, sourceKey, webViewKey };
    lastPlaybackLatencySecondsRef.current = null;
    pipActiveRef.current = false;
    playerMountedAtRef.current = Date.now();
    reportedFirstPlayingRef.current = false;

    const preserveBudget = stabilityRefreshPendingRef.current && !sourceChanged;
    stabilityRefreshPendingRef.current = false;
    stability.reset({ preserveBudget });

    userPausedRef.current = !autoplay;
    setPlaybackUi(INITIAL_BRIDGE_PLAYBACK_UI);
  }, [autoplay, playerMountedAtRef, sourceKey, stability, webViewKey]);

  const clearTransientPauseResume = useCallback(() => {
    if (transientPauseResumeTimeoutRef.current) {
      clearTimeout(transientPauseResumeTimeoutRef.current);
      transientPauseResumeTimeoutRef.current = null;
    }
  }, []);

  useUnmountCallback(clearTransientPauseResume);

  useEffect(() => {
    return () => {
      telemetry.dispose();
    };
  }, [telemetry]);

  const resetPlayerStatus = useCallback(() => {
    setPlaybackUi(prev => ({
      ...prev,
      status: { isReady: false, isBuffering: true },
    }));
  }, []);

  const injectJS = useCallback(
    (script: string) => {
      runJavaScript(`try { ${script} } catch(e) {}; true;`);
    },
    [runJavaScript],
  );

  const resumeUnlessUserPaused = useCallback(() => {
    transientPauseResumeTimeoutRef.current = null;

    if (userPausedRef.current) {
      return;
    }

    injectJS(
      'if (window.__foamEnsurePlaying) { window.__foamEnsurePlaying(); }',
    );
  }, [injectJS, userPausedRef, transientPauseResumeTimeoutRef]);

  const scheduleTransientResume = useCallback(() => {
    if (!transientPauseResumeTimeoutRef.current) {
      transientPauseResumeTimeoutRef.current = setTimeout(
        resumeUnlessUserPaused,
        250,
      );
    }
  }, [resumeUnlessUserPaused, transientPauseResumeTimeoutRef]);

  const play = useCallback(() => {
    userPausedRef.current = false;
    injectJS(
      'if (window.__foamEnsurePlaying) { window.__foamEnsurePlaying(); }',
    );
  }, [injectJS]);

  const pause = useCallback(() => {
    userPausedRef.current = true;
    clearTransientPauseResume();

    injectJS(
      'if (window.__foamStopEnsurePlaying) { window.__foamStopEnsurePlaying(); }' +
        'var v = document.querySelector("video"); if (v) { v.pause(); }',
    );
  }, [clearTransientPauseResume, injectJS]);

  const applyMuted = useCallback(
    (muted: boolean) => {
      setPlayerState(prev =>
        prev.muted === muted ? prev : { ...prev, muted },
      );

      injectJS(
        `if (window.__foamSetMuted) { window.__foamSetMuted(${muted}); }` +
          ` else { var v = document.querySelector('video'); if (v) { v.muted = ${muted}; if (!${muted}) { v.volume = 1; } } }`,
      );
    },
    [injectJS],
  );

  const togglePictureInPicture = useCallback(() => {
    injectJS(
      'if (window.__foamTogglePictureInPicture) { window.__foamTogglePictureInPicture(); }',
    );
  }, [injectJS]);

  const playerStateRef = useSyncRef(playerState);

  useImperativeHandle(
    ref,
    () => ({
      getPaused: () => playerStateRef.current.isPaused,
      pause,
      play,
      isPictureInPicture: () => pipActiveRef.current,
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
    }),
    [clearTransientPauseResume, injectJS, pause, play, playerStateRef],
  );

  const executeBridgeAction = (action: PlayerBridgeAction) => {
    switch (action.type) {
      case 'applyMuteState':
        setPlayerState(prev =>
          prev.muted === action.muted ? prev : { ...prev, muted: action.muted },
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
      case 'recordResumeTime':
        resumeTimeRef.current = action.seconds;
        break;
      case 'markFirstPlayingReported':
        reportedFirstPlayingRef.current = true;
        break;
      case 'recordLoadFailed':
        telemetry.noteLoadFailed(action.reason, action.error);
        break;
      case 'recordPlaybackStarted':
        telemetry.notePlaybackStarted(action.startSource);
        break;
      case 'notifyPlay':
        onPlay?.();
        break;
      case 'notifyReady':
        onReady?.();
        break;
      case 'notifyStabilityPlaying':
        stability.notePlaying();
        break;
      case 'notifyStabilityLatency':
        stability.noteLatency(action.latencySeconds);
        break;
      case 'notifyStabilityStall':
        stability.noteStall();
        break;
      case 'publishLatency':
        lastPlaybackLatencySecondsRef.current = action.latencySeconds;
        onPlaybackLatencyChange?.(action.latencySeconds);
        break;
      case 'scheduleAuthCompletionReload':
        scheduleAuthCompletionReload();
        break;
      case 'scheduleTransientResume':
        scheduleTransientResume();
        break;
      case 'setContentGate':
        setHasContentGate(action.hasContentGate);
        break;
      case 'setPaused':
        setPlayerState(prev => ({ ...prev, isPaused: action.isPaused }));
        break;
      case 'setPipActive':
        pipActiveRef.current = action.active;
        setPlaybackUi(prev => ({ ...prev, pipActive: action.active }));
        break;
      case 'setPlayerReady':
        setPlaybackUi(prev => ({
          ...prev,
          status: { isReady: true, isBuffering: false },
        }));
        break;
      case 'showPipUnavailableToast':
        toast.error('Picture in Picture is not available for this stream');
        break;
      case 'unlockOverlay':
        setPlaybackUi(prev => ({ ...prev, overlayUnlocked: true }));
        break;
      default:
        assertUnreachableAction(action);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parsePlayerMessage(event.nativeEvent.data);

    if (!message) {
      return;
    }

    let actions: PlayerBridgeAction[];

    try {
      actions = interpretPlayerMessage(message, {
        autoplay,
        channel,
        deferOverlayUntilUserUnmute,
        enhancedStabilityEnabled,
        lastPublishedLatencySeconds: lastPlaybackLatencySecondsRef.current,
        mountedAtMs: playerMountedAtRef.current,
        nowMs: Date.now(),
        reportedFirstPlaying: reportedFirstPlayingRef.current,
        userPaused: userPausedRef.current,
      });
    } catch (error) {
      logger.main.error('Failed to interpret player message', {
        error,
        type: message.type,
      });

      return;
    }

    try {
      for (const action of actions) {
        executeBridgeAction(action);
      }
    } catch (error) {
      logger.main.error('Failed to run player bridge action', {
        error,
        type: message.type,
      });
    }
  };

  return {
    handleMessage,
    hasContentGate,
    noteWebViewLoadFailed: telemetry.noteLoadFailed,
    noteWebViewPlaybackStarted: () =>
      telemetry.notePlaybackStarted('webview_loaded'),
    overlayUnlocked: playbackUi.overlayUnlocked,
    pause,
    pipActive: playbackUi.pipActive,
    play,
    playerState,
    playerStatus: playbackUi.status,
    resetPlayerStatus,
    setMuted: applyMuted,
    togglePictureInPicture,
  };
}
