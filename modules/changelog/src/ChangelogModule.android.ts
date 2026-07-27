import Constants from 'expo-constants';
import { createMMKV } from 'react-native-mmkv';

import type {
  ChangelogNativeModule,
  ChangelogPresentOptions,
} from './Changelog.types';
import { presentChangelogAndroid } from './changelogAndroidPresenter';

/**
 * Module-owned storage keeps `modules/changelog` free of app-layer imports,
 * mirroring how the iOS native module owns its seen-version persistence.
 */
const storage = createMMKV({ id: 'changelog' });

const SEEN_APP_VERSION_KEY = 'changelog_seen_app_version';
const SEEN_OTA_VERSION_KEY = 'changelog_seen_ota_version';

function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? 'android';
}

function markSeen(options: ChangelogPresentOptions): void {
  if (options.otaVersion) {
    storage.set(SEEN_OTA_VERSION_KEY, options.otaVersion);
    return;
  }

  const version = options.version ?? getCurrentAppVersion();
  storage.set(SEEN_APP_VERSION_KEY, version);
}

const ChangelogModule: ChangelogNativeModule = {
  getCurrentAppVersion(): string {
    return getCurrentAppVersion();
  },

  getLatestSeenAppVersion(): string | null {
    return storage.getString(SEEN_APP_VERSION_KEY) ?? null;
  },

  getLatestSeenOTAVersion(): string | null {
    return storage.getString(SEEN_OTA_VERSION_KEY) ?? null;
  },

  async present(options: ChangelogPresentOptions): Promise<void> {
    const presented = await presentChangelogAndroid(options);
    if (presented) {
      markSeen(options);
    }
  },

  resetSeenVersions(): void {
    storage.delete(SEEN_APP_VERSION_KEY);
    storage.delete(SEEN_OTA_VERSION_KEY);
  },
};

export default ChangelogModule;
