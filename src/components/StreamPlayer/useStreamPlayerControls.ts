import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Directions, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import { impact } from '@app/lib/haptics';

// A second tap within this window is the double-tap action, not two toggles.
const DOUBLE_TAP_WINDOW_MS = 260;
// Coalesce a burst of play taps: each fires a play() into the WebView and janks the screen.
const PLAY_PAUSE_THROTTLE_MS = 500;
const CONTROLS_AUTO_HIDE_MS = 5000;
const CONTROLS_FADE = { duration: 140 } as const;

interface UseStreamPlayerControlsOptions {
  onVideoAreaPress?: () => void;
  onVideoAreaSwipeDown?: () => void;
  pause: () => void;
  play: () => void;
  playerIsPaused: boolean;
}

export function useStreamPlayerControls({
  onVideoAreaPress,
  onVideoAreaSwipeDown,
  pause,
  play,
  playerIsPaused,
}: UseStreamPlayerControlsOptions) {
  // Visibility in shared values so the tap toggles controls on the UI thread even when JS is busy.
  // controlsTarget = discrete 0/1 intent; controlsOpacity = animated value; React state mirrors it.
  const controlsOpacity = useSharedValue(0);
  const controlsTarget = useSharedValue(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapAtRef = useRef(0);

  const clearAutoHide = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  const armAutoHide = useCallback(() => {
    clearAutoHide();
    controlsTimeoutRef.current = setTimeout(() => {
      controlsTimeoutRef.current = null;
      controlsTarget.value = 0;
      controlsOpacity.value = withTiming(0, CONTROLS_FADE);
      setControlsVisible(false);
    }, CONTROLS_AUTO_HIDE_MS);
  }, [clearAutoHide, controlsOpacity, controlsTarget]);

  const forceHideControls = useCallback(() => {
    clearAutoHide();
    controlsTarget.value = 0;
    controlsOpacity.value = withTiming(0, CONTROLS_FADE);
    setControlsVisible(false);
  }, [clearAutoHide, controlsOpacity, controlsTarget]);

  // Reveal the controls from JS and reset the auto-hide timer.
  const revealControls = useCallback(() => {
    controlsTarget.value = 1;
    controlsOpacity.value = withTiming(1, CONTROLS_FADE);
    setControlsVisible(true);
    armAutoHide();
  }, [armAutoHide, controlsOpacity, controlsTarget]);

  useUnmountCallback(clearAutoHide);

  const gestureHandlersRef = useRef({ onVideoAreaPress, onVideoAreaSwipeDown });
  gestureHandlersRef.current = { onVideoAreaPress, onVideoAreaSwipeDown };

  // Post-gesture bookkeeping: promote a second tap to the double-tap action, else sync timer + React state.
  const handleTapSettled = useCallback(
    (nowShown: boolean, tapTime: number) => {
      const handlers = gestureHandlersRef.current;
      if (
        handlers.onVideoAreaPress &&
        tapTime - lastTapAtRef.current < DOUBLE_TAP_WINDOW_MS
      ) {
        lastTapAtRef.current = 0;
        forceHideControls();
        if (Platform.OS !== 'web') {
          void impact('light');
        }
        handlers.onVideoAreaPress();
        return;
      }
      lastTapAtRef.current = tapTime;
      setControlsVisible(nowShown);
      if (nowShown) {
        armAutoHide();
      } else {
        clearAutoHide();
      }
    },
    [armAutoHide, clearAutoHide, forceHideControls],
  );

  const handleSwipeDown = useCallback(() => {
    if (Platform.OS !== 'web') {
      void impact('medium');
    }
    forceHideControls();
    gestureHandlersRef.current.onVideoAreaSwipeDown?.();
  }, [forceHideControls]);

  const videoTapGesture = useMemo(() => {
    const tap = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd(() => {
        'worklet';

        const tapTime = Date.now();
        // Toggle visually on the UI thread, then hand bookkeeping to JS.
        const nextShown = controlsTarget.value > 0.5 ? 0 : 1;
        controlsTarget.value = nextShown;
        controlsOpacity.value = withTiming(nextShown, CONTROLS_FADE);
        scheduleOnRN(handleTapSettled, nextShown === 1, tapTime);
      });

    // A swipe never competes with a tap, so compose them simultaneously (no added tap latency).
    if (!onVideoAreaSwipeDown) {
      return tap;
    }
    return Gesture.Simultaneous(
      tap,
      Gesture.Fling()
        .direction(Directions.DOWN)
        .onEnd(() => {
          'worklet';

          scheduleOnRN(handleSwipeDown);
        }),
    );
  }, [
    controlsOpacity,
    controlsTarget,
    handleSwipeDown,
    handleTapSettled,
    onVideoAreaSwipeDown,
  ]);

  const lastPlayPauseAtRef = useRef(0);

  const handlePlayPause = useCallback(() => {
    const now = Date.now();
    if (now - lastPlayPauseAtRef.current < PLAY_PAUSE_THROTTLE_MS) {
      revealControls();
      return;
    }
    lastPlayPauseAtRef.current = now;

    if (playerIsPaused) {
      play();
    } else {
      pause();
    }
    revealControls();
  }, [pause, play, playerIsPaused, revealControls]);

  return {
    controlsOpacity,
    controlsVisible,
    handlePlayPause,
    videoTapGesture,
  };
}
