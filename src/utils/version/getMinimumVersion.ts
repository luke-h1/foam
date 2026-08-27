import { Platform } from 'react-native';

import type {
  MinimumVersionTrack,
  RemoteConfigType,
} from '@app/hooks/firebase/useRemoteConfig';

import type { Variant } from '../../../app.config';

/**
 * Resolves the minimum required app version from Remote Config; returns an
 * empty string (no force-upgrade) for never-gated tracks like `e2e`.
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
