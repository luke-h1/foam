import Constants from 'expo-constants';

import type {
  ChangelogNativeModule,
  ChangelogPresentOptions,
} from './Changelog.types';
import { presentChangelogAndroid } from './changelogAndroidPresenter';

let latestSeenAppVersion: string | null = null;
let latestSeenOTAVersion: string | null = null;

function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? 'android';
}

function markSeen(options: ChangelogPresentOptions): void {
  const version =
    options.otaVersion ?? options.version ?? getCurrentAppVersion();

  if (options.otaVersion) {
    latestSeenOTAVersion = options.otaVersion;
  } else {
    latestSeenAppVersion = version;
  }
}

const ChangelogModule: ChangelogNativeModule = {
  getCurrentAppVersion(): string {
    return getCurrentAppVersion();
  },

  getLatestSeenAppVersion(): string | null {
    return latestSeenAppVersion;
  },

  getLatestSeenOTAVersion(): string | null {
    return latestSeenOTAVersion;
  },

  async present(options: ChangelogPresentOptions): Promise<void> {
    markSeen(options);
    await presentChangelogAndroid(options);
  },

  resetSeenVersions(): void {
    latestSeenAppVersion = null;
    latestSeenOTAVersion = null;
  },
};

export default ChangelogModule;
