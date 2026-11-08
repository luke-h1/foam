import * as Updates from 'expo-updates';

import { OTA_RELOAD_SCREEN_OPTIONS } from './constants';

interface CheckAndFetchOtaUpdateOptions {
  onUpdateAvailable?: (manifestId: string | undefined) => void;
}

/**
 * Asks the update server for a newer bundle and downloads it. Returns true when
 * an update was downloaded. Errors reach the caller.
 */
export async function checkAndFetchOtaUpdate({
  onUpdateAvailable,
}: CheckAndFetchOtaUpdateOptions = {}): Promise<boolean> {
  const result = await Updates.checkForUpdateAsync();

  if (!result.isAvailable) {
    return false;
  }

  onUpdateAvailable?.(result.manifest?.id);
  await Updates.fetchUpdateAsync();

  return true;
}

export function reloadIntoOtaUpdate(): Promise<void> {
  return Updates.reloadAsync({
    reloadScreenOptions: OTA_RELOAD_SCREEN_OPTIONS,
  });
}
