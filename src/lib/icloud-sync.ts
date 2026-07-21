import {
  initialPreferences,
  type Preferences,
  preferencesSchema,
} from '@app/store/preferences/state';
import { logger } from '@app/utils/logger';
import type { ICloudSyncNativeModule } from '@modules/icloud-sync/src/ICloudSync.types';

const ICLOUD_PREFERENCES_KEY = 'preferences.v1';

let cachedModule: ICloudSyncNativeModule | null | undefined;

function getICloudSyncModule(): ICloudSyncNativeModule | null {
  if (process.env.EXPO_OS !== 'ios') {
    return null;
  }

  if (cachedModule === undefined) {
    try {
      cachedModule =
        // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
        require('@modules/icloud-sync/src/ICloudSyncModule').default ?? null;
    } catch {
      cachedModule = null;
    }
  }

  return cachedModule ?? null;
}

export function isICloudPreferenceSyncAvailable(): boolean {
  const iCloudSyncModule = getICloudSyncModule();

  return iCloudSyncModule?.isAvailable() === true;
}

export function parsePreferencesPayload(
  rawValue: string | null,
): Preferences | null {
  if (!rawValue) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return null;
  }

  const merged =
    typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? { ...initialPreferences, ...parsed }
      : parsed;

  const result = preferencesSchema.safeParse(merged);
  if (!result.success) {
    logger.main.warn('Discarded malformed iCloud preferences', result.error);
    return null;
  }

  return result.data;
}

export async function loadPreferencesFromICloud(): Promise<Preferences | null> {
  const iCloudSyncModule = getICloudSyncModule();

  if (!iCloudSyncModule) {
    return null;
  }

  const rawValue = await iCloudSyncModule.getString(ICLOUD_PREFERENCES_KEY);

  return parsePreferencesPayload(rawValue);
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
