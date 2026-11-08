import * as ScreenOrientation from 'expo-screen-orientation';

import { logger } from '@app/utils/logger';

/**
 * Locks the app to portrait. iOS 27 can refuse the lock, so a refusal is
 * logged and the layout falls back to the window size.
 */
export function lockPortrait(): void {
  ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP,
  ).catch((error: unknown) => {
    logger.main.debug('[lockPortrait] orientation lock refused', { error });
  });
}
