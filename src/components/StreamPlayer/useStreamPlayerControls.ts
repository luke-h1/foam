import { useCallback,useLayoutEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  Directions,
  Gesture,
  type GestureType,
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import { impact } from '@app/lib/haptics';

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
  const [videoTapGesture, setVideoTapGesture] = useState<GestureType>(() =>
    Gesture.Tap().numberOfTaps(1),
  );
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      controlsTimeoutRef.current = null;
      setControlsVisible(false);
    }, 5000);
  }, []);

  const toggleControls = useCallback(() => {
    setControlsVisible(prev => {
      if (prev) {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = null;
        }
        return false;
      }

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        controlsTimeoutRef.current = null;
        setControlsVisible(false);
      }, 5000);
      return true;
    });
  }, []);

  const cancelPendingSingleTap = useCallback(() => {
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
  }, []);

  useUnmountCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
  });

  const gestureHandlersRef = useRef({
    onVideoAreaPress,
    onVideoAreaSwipeDown,
    toggleControls,
  });
  gestureHandlersRef.current = {
    onVideoAreaPress,
    onVideoAreaSwipeDown,
    toggleControls,
  };

  const handleSingleTapDelayed = useCallback(() => {
    singleTapTimeoutRef.current = setTimeout(() => {
      singleTapTimeoutRef.current = null;
      gestureHandlersRef.current.toggleControls();
    }, SINGLE_TAP_DELAY_MS);
  }, []);

  useLayoutEffect(() => {
    const handleVideoAreaDoubleTap = () => {
      cancelPendingSingleTap();
      if (Platform.OS !== 'web') {
        void impact('light');
      }
      gestureHandlersRef.current.onVideoAreaPress?.();
    };

    const handleVideoAreaSwipeDown = () => {
      cancelPendingSingleTap();
      if (Platform.OS !== 'web') {
        void impact('medium');
      }
      gestureHandlersRef.current.onVideoAreaSwipeDown?.();
    };

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd(() => {
        'worklet';

        scheduleOnRN(handleSingleTapDelayed);
      });
    if (!onVideoAreaPress && !onVideoAreaSwipeDown) {
      setVideoTapGesture(singleTap);
      return;
    }
    const gestures = [];
    if (onVideoAreaPress) {
      gestures.push(
        Gesture.Tap()
          .numberOfTaps(2)
          .onEnd(() => {
            'worklet';

            scheduleOnRN(handleVideoAreaDoubleTap);
          }),
      );
    }
    if (onVideoAreaSwipeDown) {
      gestures.push(
        Gesture.Fling()
          .direction(Directions.DOWN)
          .onEnd(() => {
            'worklet';

            scheduleOnRN(handleVideoAreaSwipeDown);
          }),
      );
    }
    gestures.push(singleTap);
    setVideoTapGesture(
      Gesture.Exclusive(...gestures) as unknown as GestureType,
    );
  }, [
    cancelPendingSingleTap,
    handleSingleTapDelayed,
    onVideoAreaPress,
    onVideoAreaSwipeDown,
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
