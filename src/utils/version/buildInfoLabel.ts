import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

/**
 * Human-readable build identifier shown in the settings footer so we can
 * quickly see which native version and OTA update a user is running.
 */
export function getBuildInfoLabel(): string {
  const version = Application.nativeApplicationVersion ?? '';
  const build = Application.nativeBuildVersion ?? '';
  const ota = Updates.updateId ?? 'Embedded';

  return `v${version} (${build}) • OTA: ${ota}`;
}
