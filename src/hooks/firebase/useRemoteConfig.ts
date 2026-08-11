import '@react-native-firebase/installations';

import { useState } from 'react';

import { getApp } from '@react-native-firebase/app';
import {
  fetchAndActivate,
  getAll,
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
} from '@react-native-firebase/remote-config';
import { useQuery } from '@tanstack/react-query';

import { logger } from '@app/utils/logger';

import {
  buildRemoteConfigFromDefaults,
  defaultRemoteConfig,
  parseRemoteConfigValue,
  type RemoteConfigEntry,
  type RemoteConfigKey,
  type RemoteConfigSchema,
  type RemoteConfigType,
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

let cachedRemoteConfig: ReturnType<typeof getRemoteConfig> | null = null;
let remoteConfigFetchPromise: Promise<boolean> | null = null;

/**
 * Created on first use instead of at module scope - the handle plus
 * setConfigSettings/setDefaults were three Firebase bridge calls at import
 * time, and this module sits in the boot graph via the force-update modal
 * and the settings tab.
 */
function getRemoteConfigHandle() {
  if (cachedRemoteConfig) {
    return cachedRemoteConfig;
  }
  const remoteConfig = getRemoteConfig(getApp());
  cachedRemoteConfig = remoteConfig;
  void setConfigSettings(remoteConfig, {
    minimumFetchIntervalMillis: __DEV__ ? 60 * 1000 : 5 * 60 * 1000,
  });
  setDefaults(remoteConfig, defaultRemoteConfig).catch(e => {
    logger.remoteConfig.error('Failed to set default remote config values', e);
  });
  return remoteConfig;
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return null;
}

function isRemoteConfigCancellation(error: unknown): boolean {
  const message = getErrorMessage(error)?.toLowerCase();
  return message?.includes('cancelled') ?? false;
}

async function fetchRemoteConfig(): Promise<boolean> {
  if (remoteConfigFetchPromise) {
    return remoteConfigFetchPromise;
  }

  remoteConfigFetchPromise = fetchAndActivate(getRemoteConfigHandle())
    .then(activated => {
      logger.remoteConfig.info('fetchAndActivate', {
        activated,
        message: activated
          ? 'Fetched new config from server'
          : 'Using cached config (no new data)',
      });

      return activated;
    })
    .catch(error => {
      if (isRemoteConfigCancellation(error)) {
        logger.remoteConfig.info('fetchAndActivate cancelled', {
          error: getErrorMessage(error),
        });
        return false;
      }

      logger.remoteConfig.error('fetchAndActivate failed', error);
      return false;
    })
    .finally(() => {
      remoteConfigFetchPromise = null;
    });

  return remoteConfigFetchPromise;
}

function readRemoteConfig(): RemoteConfigType {
  const allConfig = getAll(getRemoteConfigHandle());
  return Object.fromEntries(
    (Object.keys(defaultRemoteConfig) as RemoteConfigKey[]).map(key => {
      const entry = allConfig[key];
      const raw = entry?.asString() ?? defaultRemoteConfig[key];
      return [
        key,
        {
          raw,
          value: parseRemoteConfigValue(key, raw),
          source: entry?.getSource() ?? 'default',
        } satisfies RemoteConfigEntry<RemoteConfigSchema[RemoteConfigKey]>,
      ];
    }),
  ) as RemoteConfigType;
}

export function useRemoteConfig(): UseRemoteConfigResult {
  const [isManualRefetching, setIsManualRefetching] = useState(false);

  const {
    data: config = buildRemoteConfigFromDefaults('default'),
    refetch: refetchQuery,
    isFetching,
    isFetched,
  } = useQuery({
    queryKey: ['remoteConfig'],
    queryFn: async () => {
      await fetchRemoteConfig();
      return readRemoteConfig();
    },
    staleTime: 5 * 60 * 1000,
    initialData: () => buildRemoteConfigFromDefaults('default'),
    // Without this, initialData (admins: []) counts as fresh for staleTime, so
    // queryFn never runs on mount and the real config is never fetched/read.
    // Backdating it marks the defaults stale immediately so we fetch on mount.
    initialDataUpdatedAt: 0,
  });

  const refetch = async (): Promise<boolean> => {
    setIsManualRefetching(true);
    try {
      const result = await refetchQuery();
      return result.data !== undefined;
    } finally {
      setIsManualRefetching(false);
    }
  };

  return {
    config,
    refetch,
    isRefetching: isFetching || isManualRefetching,
    isLoading: !isFetched,
  };
}
