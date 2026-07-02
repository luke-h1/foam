import { Platform } from 'react-native';

import type {
  MinimumVersionTrack,
  RemoteConfigType,
} from '@app/hooks/firebase/useRemoteConfig';

import type { Variant } from '../../../app.config';

/**
 * Resolves the minimum required app version for the current platform and
 * release track from Remote Config. Returns an empty string (no force-upgrade)
 * for tracks that are never gated, such as `e2e` builds.
 */
export function getMinimumVersion(
  variant: Variant,
  remoteConfig: RemoteConfigType,
): string {
  if (variant === 'e2e') {
    return '';
  }

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const platformConfig = remoteConfig.minimumVersion.value[platform];
  const track: MinimumVersionTrack = variant;

  return platformConfig?.[track] ?? '';
}
