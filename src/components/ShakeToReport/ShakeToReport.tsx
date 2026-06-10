import { useShakeDetector } from '@app/hooks/useShakeDetector';
import { showFeedbackWidget } from '@app/lib/sentry';
import { usePreference } from '@app/store/preferenceStore';
import { useRef } from 'react';

const SHAKE_COOLDOWN_MS = 30_000;

// Detox shakes the simulator during scroll synthesis; keep e2e inert.
const isE2E = process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e';

/**
 * Opens the Sentry feedback widget when the user shakes their device,
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
      showFeedbackWidget();
    },
    { enabled: shakeToReport && !isE2E },
  );

  return null;
}
