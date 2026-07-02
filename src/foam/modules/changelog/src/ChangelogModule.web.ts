import { registerWebModule, NativeModule } from 'expo';

import type {
  ChangelogModuleEvents,
  ChangelogNativeModule,
  ChangelogPresentOptions,
} from './Changelog.types';

const latestSeenAppVersionKey = 'Changelog.LatestSeenAppVersion';
const latestSeenOTAVersionKey = 'Changelog.LatestSeenOTAVersion';

class ChangelogModule
  extends NativeModule<ChangelogModuleEvents>
  implements ChangelogNativeModule
{
  getCurrentAppVersion(): string {
    return 'web';
  }

  getLatestSeenAppVersion(): string | null {
    return localStorage.getItem(latestSeenAppVersionKey);
  }

  getLatestSeenOTAVersion(): string | null {
    return localStorage.getItem(latestSeenOTAVersionKey);
  }

  async present(options: ChangelogPresentOptions): Promise<void> {
    const version =
      options.otaVersion ?? options.version ?? this.getCurrentAppVersion();

    if (options.otaVersion) {
      localStorage.setItem(latestSeenOTAVersionKey, options.otaVersion);
    } else {
      localStorage.setItem(latestSeenAppVersionKey, version);
    }

    window.alert(`Changelog demo: ${version}`);
  }

  resetSeenVersions(): void {
    localStorage.removeItem(latestSeenAppVersionKey);
    localStorage.removeItem(latestSeenOTAVersionKey);
  }
}

export default registerWebModule(ChangelogModule, 'Changelog');
