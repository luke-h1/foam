import {
  RemoteConfigType,
  useRemoteConfig,
} from '@app/hooks/firebase/useRemoteConfig';
import { isUpdateRequired } from '@app/utils/version/compareVersions';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { Variant } from '../../app.config';

/**
 * Hook to check if a forced update is required based on Firebase Remote Config
 * Uses separate minimum versions for preview and production tracks per platform
 * @returns Object containing whether update is required, minimum version, and optional custom update URL
 */

function getMinimumVersion(variant: Variant, remoteConfig: RemoteConfigType) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const platformConfig = remoteConfig.minimumVersion.value[platform];

  switch (variant) {
    case 'development':
      return platformConfig?.development ?? '';
    case 'production':
      return platformConfig?.production ?? '';
    case 'preview':
      return platformConfig?.preview ?? '';
    default:
      return '';
  }
}

export type UseForceUpdateResult = {
  updateRequired: boolean;
  minimumVersion: string;
  currentVersion: string | null;
  variant: Variant;
};

export function useForceUpdate(): UseForceUpdateResult {
  const { config: remoteConfig } = useRemoteConfig();
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
