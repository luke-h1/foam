import { createShakeDetector } from '@app/utils/shake/shakeDetection';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

const ACCELEROMETER_INTERVAL_MS = 80;

interface UseShakeDetectorOptions {
  enabled: boolean;
}

export function useShakeDetector(
  onShake: () => void,
  { enabled }: UseShakeDetectorOptions,
): void {
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      return;
    }

    const detect = createShakeDetector();
    Accelerometer.setUpdateInterval(ACCELEROMETER_INTERVAL_MS);
    const subscription = Accelerometer.addListener(sample => {
      if (AppState.currentState !== 'active') {
        return;
      }

      if (detect(sample, Date.now())) {
        onShakeRef.current();
      }
    });

    return () => subscription.remove();
  }, [enabled]);
}
