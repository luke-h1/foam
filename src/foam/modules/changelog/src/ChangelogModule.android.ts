import Constants from 'expo-constants';

import type {
  ChangelogNativeModule,
  ChangelogPresentOptions,
} from './Changelog.types';

let latestSeenAppVersion: string | null = null;
let latestSeenOTAVersion: string | null = null;

function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? 'android';
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
    const version =
      options.otaVersion ?? options.version ?? getCurrentAppVersion();

    if (options.otaVersion) {
      latestSeenOTAVersion = options.otaVersion;
    } else {
      latestSeenAppVersion = version;
    }
  },

  resetSeenVersions(): void {
    latestSeenAppVersion = null;
    latestSeenOTAVersion = null;
  },
};

export default ChangelogModule;
