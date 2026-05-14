import ChangelogModule from './ChangelogModule';
import type { ChangelogPresentOptions } from './Changelog.types';

export { default as ChangelogView } from './ChangelogView';
export * from './Changelog.types';

export function getCurrentAppVersion(): string {
  return ChangelogModule.getCurrentAppVersion();
}

export function getLatestSeenAppVersion(): string | null {
  return ChangelogModule.getLatestSeenAppVersion();
}

export function getLatestSeenOTAVersion(): string | null {
  return ChangelogModule.getLatestSeenOTAVersion();
}

export function presentChangelog(
  options: ChangelogPresentOptions,
): Promise<void> {
  return ChangelogModule.present(options);
}

export function resetSeenChangelogVersions(): void {
  ChangelogModule.resetSeenVersions();
}

export default ChangelogModule;
