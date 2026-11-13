import { getHinge } from 'expo-hinge';
import * as ScreenOrientation from 'expo-screen-orientation';

import { logger } from '@app/utils/logger';

export function lockPortrait(): void {
  // On a foldable the lock sticks: it pins the unfolded display to
  // portrait, and nothing unlocks it until the stream player unlocks on
  // focus. Verified on the iPhone Duo simulator. Never lock on a hinged
  // device.
  if (getHinge() != null) {
    return;
  }

  ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP,
  ).catch((error: unknown) => {
    logger.main.debug('[lockPortrait] orientation lock refused', { error });
  });
}
