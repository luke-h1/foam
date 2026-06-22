import type { Preferences } from '@app/store/preferenceStore';
import type { ICloudSyncNativeModule } from '@modules/icloud-sync/src/ICloudSync.types';

const ICLOUD_PREFERENCES_KEY = 'preferences.v1';

let cachedICloudSyncModule: ICloudSyncNativeModule | null | undefined;

function getICloudSyncModule(): ICloudSyncNativeModule | null {
  if (process.env.EXPO_OS !== 'ios') {
    return null;
  }

  if (cachedICloudSyncModule !== undefined) {
    return cachedICloudSyncModule;
  }

  try {
    cachedICloudSyncModule =
      // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
      require('@modules/icloud-sync/src/ICloudSyncModule').default ?? null;
  } catch {
    cachedICloudSyncModule = null;
  }

  return cachedICloudSyncModule ?? null;
}

export function isICloudPreferenceSyncAvailable(): boolean {
  const iCloudSyncModule = getICloudSyncModule();

  return iCloudSyncModule?.isAvailable() === true;
}

export async function loadPreferencesFromICloud(): Promise<Preferences | null> {
  const iCloudSyncModule = getICloudSyncModule();

  if (!iCloudSyncModule) {
    return null;
  }

  const rawValue = await iCloudSyncModule.getString(ICLOUD_PREFERENCES_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Preferences;
  } catch {
    return null;
  }
}

export async function savePreferencesToICloud(
  preferences: Preferences,
): Promise<void> {
  const iCloudSyncModule = getICloudSyncModule();

  if (!iCloudSyncModule) {
    return;
  }

  await iCloudSyncModule.setString(
    ICLOUD_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
}

export async function synchronizeICloudPreferences(): Promise<boolean> {
  const iCloudSyncModule = getICloudSyncModule();

  if (!iCloudSyncModule) {
    return false;
  }

  return iCloudSyncModule.synchronize();
}
