import Constants from 'expo-constants';

import { storageService } from '@app/lib/storage';

import type {
  ChangelogNativeModule,
  ChangelogPresentOptions,
} from './Changelog.types';
import { presentChangelogAndroid } from './changelogAndroidPresenter';

const SEEN_APP_VERSION_KEY = 'changelog_seen_app_version';
const SEEN_OTA_VERSION_KEY = 'changelog_seen_ota_version';

function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? 'android';
}

function markSeen(options: ChangelogPresentOptions): void {
  if (options.otaVersion) {
    storageService.set(SEEN_OTA_VERSION_KEY, options.otaVersion);
    return;
  }

  const version = options.version ?? getCurrentAppVersion();
  storageService.set(SEEN_APP_VERSION_KEY, version);
}

const ChangelogModule: ChangelogNativeModule = {
  getCurrentAppVersion(): string {
    return getCurrentAppVersion();
  },

  getLatestSeenAppVersion(): string | null {
    return storageService.getString<string>(SEEN_APP_VERSION_KEY);
  },

  getLatestSeenOTAVersion(): string | null {
    return storageService.getString<string>(SEEN_OTA_VERSION_KEY);
  },

  async present(options: ChangelogPresentOptions): Promise<void> {
    const presented = await presentChangelogAndroid(options);
    if (presented) {
      markSeen(options);
    }
  },

  resetSeenVersions(): void {
    storageService.remove(SEEN_APP_VERSION_KEY);
    storageService.remove(SEEN_OTA_VERSION_KEY);
  },
};

export default ChangelogModule;
