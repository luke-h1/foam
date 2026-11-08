import * as Updates from 'expo-updates';

import { OTA_RELOAD_SCREEN_OPTIONS } from './constants';

interface CheckAndFetchOtaUpdateOptions {
  onUpdateAvailable?: (manifestId: string | undefined) => void;
}

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
