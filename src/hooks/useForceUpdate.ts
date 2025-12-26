import {
  RemoteConfigType,
  useRemoteConfig,
} from '@app/hooks/firebase/useRemoteConfig';
import { isUpdateRequired } from '@app/utils/version/compareVersions';
import * as Application from 'expo-application';
import { Variant } from '../../app.config';

/**
 * Hook to check if a forced update is required based on Firebase Remote Config
 * Uses separate minimum versions for preview and production tracks
 * @returns Object containing whether update is required, minimum version, and optional custom update URL
 */

function getMinimumVersion(variant: Variant, remoteConfig: RemoteConfigType) {
  switch (variant) {
    case 'development':
      return '';
    case 'production':
      return remoteConfig.minimumProductionVersion.value;
    case 'preview':
      return remoteConfig.minimumPreviewVersion.value;
    default:
      return '';
  }
}

export function useForceUpdate() {
  const remoteConfig = useRemoteConfig();
  const variant = process.env.APP_VARIANT as Variant;

  const minimumVersion = getMinimumVersion(variant, remoteConfig);
  const currentVersion = Application.nativeApplicationVersion;

  if (!minimumVersion) {
    return {
      updateRequired: false,
      minimumVersion: '',
      currentVersion,
      variant,
    };
  }

  const updateRequired =
    isUpdateRequired(currentVersion, minimumVersion) ?? false;

  return {
    updateRequired,
    minimumVersion,
    currentVersion,
    variant,
  };
}
