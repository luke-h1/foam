import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

export function getBuildInfoLabel(): string {
  const version = Application.nativeApplicationVersion ?? '';
  const build = Application.nativeBuildVersion ?? '';
  const ota = Updates.updateId ?? 'Embedded';

  return `v${version} (${build}) • OTA: ${ota}`;
}
