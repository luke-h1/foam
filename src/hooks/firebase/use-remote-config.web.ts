import {
  buildRemoteConfigFromDefaults,
  type UseRemoteConfigResult,
} from './remote-config-model';

export type {
  BundleUpdateButtonEnabled,
  MinimumVersionTrack,
  RemoteConfigEntry,
  RemoteConfigKey,
  RemoteConfigSchema,
  RemoteConfigType,
  UseRemoteConfigResult,
} from './remote-config-model';
export { defaultRemoteConfig } from './remote-config-model';

async function refetch(): Promise<boolean> {
  return false;
}

export function useRemoteConfig(): UseRemoteConfigResult {
  const config = buildRemoteConfigFromDefaults('static');

  return { config, refetch, isRefetching: false, isLoading: false };
}
