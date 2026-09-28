import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import { useOnAppStateChange } from '@app/hooks/use-on-app-state-change';
import { isForegroundTransition } from '@app/utils/app-state/app-state-transitions';
import { logger } from '@app/utils/logger';

import { PLAYER_LOAD_TIMEOUT_MS } from '../util/player-telemetry';

/**
 * Linger so the first decoded frame is on screen before the poster fades.
 */
const POSTER_HIDE_DELAY_MS = 450;

/**
 * Owns everything that happens around a WebView generation: when it remounts,
 * when the poster comes off, and the layer-tree pulses iOS needs to keep the
 * AVPlayer layer attached.
 */
export function useStreamPlayerLifecycle({
  channel,
  sourceKey,
}: {
  channel: string | undefined;
  sourceKey: string;
}) {
  const needsInitRef = useRef(true);

  const authCompletionReloadTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [webViewKey, setWebViewKey] = useState(0);

  /**
   * Force a resize after playback starts to rebuild the layer tree when
   * WKWebView fails to attach the AVPlayer layer; +2.5s pulse covers late autoplay.
   */
  const [layoutNudge, setLayoutNudge] = useState(0);

  const nudgeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nudgePlayedRef = useRef(false);

  const nudgeLayerTree = useCallback(() => {
    nudgeTimeoutsRef.current.forEach(clearTimeout);
    nudgeTimeoutsRef.current = [];

    const pulse = (delay: number) => {
      nudgeTimeoutsRef.current.push(
        setTimeout(() => setLayoutNudge(1), delay),
        setTimeout(() => setLayoutNudge(0), delay + 120),
      );
    };

    pulse(0);
    pulse(2500);
  }, []);

  /**
   * Loading frame stays over the WebView until playback starts, hiding the
   * black box during page load.
   */
  const [loadedGeneration, setLoadedGeneration] = useState<string | null>(null);

  const generationRef = useRef('');

  const posterHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleBridgePlaying = useCallback(() => {
    if (nudgePlayedRef.current) {
      return;
    }

    nudgePlayedRef.current = true;

    if (!posterHideTimeoutRef.current) {
      posterHideTimeoutRef.current = setTimeout(() => {
        posterHideTimeoutRef.current = null;
        setLoadedGeneration(generationRef.current);
      }, POSTER_HIDE_DELAY_MS);
    }

    nudgeLayerTree();
  }, [nudgeLayerTree]);

  /**
   * iOS does not reliably re-attach the AVPlayer layer after backgrounding,
   * so pulse again on every foreground.
   */
  useOnAppStateChange(transition => {
    if (isForegroundTransition(transition)) {
      nudgeLayerTree();
    }
  });

  const lastPlayerSizeRef = useRef<{ width: number; height: number } | null>(
    null,
  );

  const handlePlayerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
      const previous = lastPlayerSizeRef.current;
      lastPlayerSizeRef.current = { width: nextWidth, height: nextHeight };

      if (
        previous &&
        (Math.round(previous.width) !== Math.round(nextWidth) ||
          Math.round(previous.height) !== Math.round(nextHeight))
      ) {
        nudgeLayerTree();
      }
    },
    [nudgeLayerTree],
  );

  useEffect(() => {
    const timeoutsRef = nudgeTimeoutsRef;
    const posterTimeoutRef = posterHideTimeoutRef;

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      if (posterTimeoutRef.current) {
        clearTimeout(posterTimeoutRef.current);
      }
    };
  }, []);

  const generation = `${sourceKey}|${webViewKey}`;

  useEffect(() => {
    generationRef.current = generation;
  }, [generation]);

  /**
   * Last reported VOD playback offset (seconds). Survives a WebView remount so
   * the embed can resume instead of restarting at 0:00; reset per source.
   */
  const resumeTimeRef = useRef(0);

  useEffect(() => {
    needsInitRef.current = true;
    nudgePlayedRef.current = false;
    resumeTimeRef.current = 0;
  }, [sourceKey]);

  /**
   * Arm a safety dismissal per generation so a load that never finishes can't
   * trap the loading frame over the player.
   */
  useEffect(() => {
    const timeout = setTimeout(
      () => setLoadedGeneration(generationRef.current),
      PLAYER_LOAD_TIMEOUT_MS,
    );
    return () => clearTimeout(timeout);
  }, [sourceKey, webViewKey]);

  const remountEmbedWebView = useCallback(() => {
    logger.main.info('webview remounted', {
      name: 'twitch_player_info',
      channel,
    });

    needsInitRef.current = true;
    nudgePlayedRef.current = false;

    if (posterHideTimeoutRef.current) {
      clearTimeout(posterHideTimeoutRef.current);
      posterHideTimeoutRef.current = null;
    }

    setWebViewKey(key => key + 1);
  }, [channel]);

  const scheduleAuthCompletionReload = useCallback(() => {
    if (authCompletionReloadTimeoutRef.current) {
      return;
    }

    authCompletionReloadTimeoutRef.current = setTimeout(() => {
      authCompletionReloadTimeoutRef.current = null;
      remountEmbedWebView();
    }, 750);
  }, [remountEmbedWebView]);

  useEffect(() => {
    const timeoutRef = authCompletionReloadTimeoutRef;

    return () => {
      const timeoutId = timeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    handleBridgePlaying,
    handlePlayerLayout,
    isPlayerLoading: loadedGeneration !== generation,
    layoutNudge,
    needsInitRef,
    remountEmbedWebView,
    resumeTimeRef,
    scheduleAuthCompletionReload,
    webViewKey,
  };
}
