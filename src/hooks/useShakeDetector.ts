import { useEffect } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';

import { Accelerometer } from 'expo-sensors';

import { useSyncRef } from '@app/hooks/useSyncRef';
import { createShakeDetector } from '@app/utils/shake/shakeDetection';

// Shake detection doesn't need 12.5 Hz; ~6-7 Hz still catches a shake
// gesture and halves the native->JS callback rate.
const ACCELEROMETER_INTERVAL_MS = 150;

interface UseShakeDetectorOptions {
  enabled: boolean;
}

export function useShakeDetector(
  onShake: () => void,
  { enabled }: UseShakeDetectorOptions,
): void {
  const onShakeRef = useSyncRef(onShake);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      return;
    }

    let subscription: ReturnType<typeof Accelerometer.addListener> | null =
      null;
    let cancelled = false;
    // The accelerometer stream starts ~12 native->JS callbacks per second the
    // moment providers mount; hold it until boot interactions settle.
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) {
        return;
      }
      const detect = createShakeDetector();
      Accelerometer.setUpdateInterval(ACCELEROMETER_INTERVAL_MS);
      subscription = Accelerometer.addListener(sample => {
        if (AppState.currentState !== 'active') {
          return;
        }

        if (detect(sample, Date.now())) {
          onShakeRef.current();
        }
      });
    });

    return () => {
      cancelled = true;
      task.cancel();
      subscription?.remove();
    };
  }, [enabled, onShakeRef]);
}
