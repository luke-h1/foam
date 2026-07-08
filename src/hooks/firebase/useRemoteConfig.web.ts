import { useCallback, useState } from 'react';

import {
  buildRemoteConfigFromDefaults,
  type UseRemoteConfigResult,
} from './remoteConfigModel';

export type {
  BundleUpdateButtonEnabled,
  MinimumVersionTrack,
  RemoteConfigEntry,
  RemoteConfigKey,
  RemoteConfigSchema,
  RemoteConfigType,
  UseRemoteConfigResult,
} from './remoteConfigModel';
export { defaultRemoteConfig } from './remoteConfigModel';

export function useRemoteConfig(): UseRemoteConfigResult {
  const config = buildRemoteConfigFromDefaults('static');
  const [isRefetching, setIsRefetching] = useState(false);

  const refetch = useCallback(async (): Promise<boolean> => {
    setIsRefetching(true);
    setIsRefetching(false);
    return false;
  }, []);

  return { config, refetch, isRefetching, isLoading: false };
}
