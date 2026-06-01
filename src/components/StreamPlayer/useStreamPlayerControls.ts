import { impact } from '@app/lib/haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Directions, Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

const SINGLE_TAP_DELAY_MS = 400;

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
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsVisibleRef = useRef(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showControls = useCallback(() => {
    controlsVisibleRef.current = true;
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      controlsVisibleRef.current = false;
      setControlsVisible(false);
    }, 5000);
  }, []);

  const dismissControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsVisibleRef.current = false;
    setControlsVisible(false);
  }, []);

  const toggleControls = useCallback(() => {
    if (controlsVisibleRef.current) {
      dismissControls();
    } else {
      showControls();
    }
  }, [dismissControls, showControls]);

  const cancelPendingSingleTap = useCallback(() => {
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      cancelPendingSingleTap();
    };
  }, [cancelPendingSingleTap]);

  const handleVideoAreaDoubleTap = useCallback(() => {
    cancelPendingSingleTap();
    if (Platform.OS !== 'web') {
      void impact('light');
    }
    onVideoAreaPress?.();
  }, [cancelPendingSingleTap, onVideoAreaPress]);

  const handleVideoAreaSwipeDown = useCallback(() => {
    cancelPendingSingleTap();
    if (Platform.OS !== 'web') {
      void impact('medium');
    }
    onVideoAreaSwipeDown?.();
  }, [cancelPendingSingleTap, onVideoAreaSwipeDown]);

  const handleSingleTapDelayed = useCallback(() => {
    singleTapTimeoutRef.current = setTimeout(() => {
      singleTapTimeoutRef.current = null;
      toggleControls();
    }, SINGLE_TAP_DELAY_MS);
  }, [toggleControls]);

  const videoTapGesture = useMemo(() => {
    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd(() => {
        scheduleOnRN(handleSingleTapDelayed);
      });
    if (!onVideoAreaPress && !onVideoAreaSwipeDown) {
      return singleTap;
    }
    const gestures = [];
    if (onVideoAreaPress) {
      gestures.push(
        Gesture.Tap()
          .numberOfTaps(2)
          .onEnd(() => {
            scheduleOnRN(handleVideoAreaDoubleTap);
          }),
      );
    }
    if (onVideoAreaSwipeDown) {
      gestures.push(
        Gesture.Fling()
          .direction(Directions.DOWN)
          .onEnd(() => {
            scheduleOnRN(handleVideoAreaSwipeDown);
          }),
      );
    }
    gestures.push(singleTap);
    return Gesture.Exclusive(...gestures);
  }, [
    onVideoAreaPress,
    onVideoAreaSwipeDown,
    handleVideoAreaDoubleTap,
    handleVideoAreaSwipeDown,
    handleSingleTapDelayed,
  ]);

  const handlePlayPause = useCallback(() => {
    if (playerIsPaused) {
      play();
    } else {
      pause();
    }
    showControls();
  }, [pause, play, playerIsPaused, showControls]);

  return {
    controlsVisible,
    handlePlayPause,
    toggleControls,
    videoTapGesture,
  };
}
