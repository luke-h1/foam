import { useShakeDetector } from '@app/hooks/useShakeDetector';
import { usePreference } from '@app/store/preferenceStore';
import { router } from 'expo-router';
import { useRef } from 'react';

const SHAKE_COOLDOWN_MS = 30_000;

// Detox shakes the simulator during scroll synthesis; keep e2e inert.
const isE2E = process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e';

/**
 * Opens the custom feedback screen when the user shakes their device,
 * so bugs can be reported from anywhere without hunting through
 * settings. Toggled via the shakeToReport preference.
 */
export function ShakeToReport() {
  const shakeToReport = usePreference('shakeToReport');
  const lastTriggeredAtRef = useRef(0);

  useShakeDetector(
    () => {
      const now = Date.now();
      if (now - lastTriggeredAtRef.current < SHAKE_COOLDOWN_MS) {
        return;
      }
      lastTriggeredAtRef.current = now;
      router.push('/feedback');
    },
    { enabled: shakeToReport && !isE2E },
  );

  return null;
}
