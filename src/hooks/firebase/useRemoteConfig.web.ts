import { logger } from '@app/utils/logger';
import { useState, useCallback } from 'react';

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

  /**
   * Url
   */
  statusPageUrl: string;
  websiteUrl: string;
}

export type RemoteConfigKey = keyof RemoteConfigSchema;

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
} satisfies Record<RemoteConfigKey, string>;

const jsonKeys: RemoteConfigKey[] = ['splash', 'minimumVersion'];

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
          source: 'static',
        },
      ];
    }),
  ) as RemoteConfigType;
}

export type UseRemoteConfigResult = {
  config: RemoteConfigType;
  refetch: () => Promise<boolean>;
  isRefetching: boolean;
};

export function useRemoteConfig(): UseRemoteConfigResult {
  const config = buildConfigFromDefaults();
  const [isRefetching, setIsRefetching] = useState(false);

  const refetch = useCallback(async (): Promise<boolean> => {
    setIsRefetching(true);
    setIsRefetching(false);
    return false;
  }, []);

  return { config, refetch, isRefetching };
}
