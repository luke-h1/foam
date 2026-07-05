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

const remoteConfig = getRemoteConfig(getApp());
let remoteConfigFetchPromise: Promise<boolean> | null = null;

void setConfigSettings(remoteConfig, {
  minimumFetchIntervalMillis: __DEV__ ? 60 * 1000 : 5 * 60 * 1000,
});

export interface RemoteConfigSchema {
  splash: { '7tvUnavailable': boolean; app: boolean };

  /**
   * Minimum version of the app required per platform and track
   */
  minimumVersion: {
    android: {
      development: string;
      internal: string;
      testflight: string;
      production: string;
    };
    ios: {
      development: string;
      internal: string;
      testflight: string;
      production: string;
    };
  };

  statusPageUrl: string;
  websiteUrl: string;
  admins: string[];

  /**
   * A/B test variant assignments keyed by experiment name. Firebase A/B Testing
   * sets this per user; the client reads it via `useExperiment`.
   */
  experiments: Record<string, string>;
}

export type RemoteConfigKey = keyof RemoteConfigSchema;

export type MinimumVersionTrack =
  keyof RemoteConfigSchema['minimumVersion']['ios'];

type ConfigSource = 'default' | 'remote' | 'static';

export type RemoteConfigEntry<T> = {
  raw: string;
  value: T;
  source: ConfigSource;
};

export type RemoteConfigType = {
  [K in RemoteConfigKey]: RemoteConfigEntry<RemoteConfigSchema[K]>;
};

export const defaultRemoteConfig = {
  splash: '{"7tvUnavailable": false, "app": false}',
  minimumVersion:
    '{"android": {"development": "0.0.0", "internal": "0.0.0", "testflight": "0.0.0", "production": "0.0.0"}, "ios": {"development": "0.0.0", "internal": "0.0.0", "testflight": "0.0.0", "production": "0.0.0"}}',
  statusPageUrl: 'https://status.foam-app.com',
  websiteUrl: 'https://foam-app.com',
  admins: '[]',
  experiments: '{}',
} satisfies Record<RemoteConfigKey, string>;

const jsonKeys: RemoteConfigKey[] = [
  'splash',
  'minimumVersion',
  'admins',
  'experiments',
];

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

function parseValue<K extends RemoteConfigKey>(
  key: K,
  raw: string,
): RemoteConfigSchema[K] {
  if (jsonKeys.includes(key)) {
    try {
      return JSON.parse(raw) as RemoteConfigSchema[K];
    } catch {
      logger.remoteConfig.error(`Failed to parse JSON for key: ${key}`, {
        raw,
      });
      return JSON.parse(defaultRemoteConfig[key]) as RemoteConfigSchema[K];
    }
  }
  return raw as RemoteConfigSchema[K];
}

function buildConfigFromDefaults(): RemoteConfigType {
  return Object.fromEntries(
    (Object.keys(defaultRemoteConfig) as RemoteConfigKey[]).map(key => {
      const raw = defaultRemoteConfig[key];
      return [
        key,
        {
          raw,
          value: parseValue(key, raw),
          source: 'default',
        } satisfies RemoteConfigEntry<RemoteConfigSchema[RemoteConfigKey]>,
      ];
    }),
  ) as RemoteConfigType;
}

setDefaults(remoteConfig, defaultRemoteConfig).catch(e => {
  logger.remoteConfig.error('Failed to set default remote config values', e);
});

export type UseRemoteConfigResult = {
  config: RemoteConfigType;
  refetch: () => Promise<boolean>;
  isRefetching: boolean;
  isLoading: boolean;
};

async function fetchRemoteConfig(): Promise<boolean> {
  if (remoteConfigFetchPromise) {
    return remoteConfigFetchPromise;
  }

  remoteConfigFetchPromise = fetchAndActivate(remoteConfig)
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
  const allConfig = getAll(remoteConfig);
  return Object.fromEntries(
    Object.entries(allConfig).flatMap(([key, entry]) => {
      if (!(key in defaultRemoteConfig)) {
        return [];
      }

      const raw = entry.asString();
      return [
        [
          key,
          {
            raw,
            value: parseValue(key as RemoteConfigKey, raw),
            source: entry.getSource(),
          } satisfies RemoteConfigEntry<RemoteConfigSchema[RemoteConfigKey]>,
        ],
      ];
    }),
  ) as RemoteConfigType;
}

export function useRemoteConfig(): UseRemoteConfigResult {
  const [isManualRefetching, setIsManualRefetching] = useState(false);

  const {
    data: config = buildConfigFromDefaults(),
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
    initialData: buildConfigFromDefaults,
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
