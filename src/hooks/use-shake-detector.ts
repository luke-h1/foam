import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { Accelerometer } from 'expo-sensors';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import { runWhenIdle } from '@app/utils/runWhenIdle';
import { createShakeDetector } from '@app/utils/shake/shakeDetection';

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

    const task = runWhenIdle(() => {
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
