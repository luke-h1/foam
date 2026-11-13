import { getHinge } from 'expo-hinge';
import * as ScreenOrientation from 'expo-screen-orientation';

import { logger } from '@app/utils/logger';

export function lockPortrait(): void {
  if (getHinge() != null) {
    return;
  }

  ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP,
  ).catch((error: unknown) => {
    logger.main.debug('[lockPortrait] orientation lock refused', { error });
  });
}
