import '@react-native-firebase/installations';
import { sentryService } from '@app/services/sentry-service';
import { logger } from '@app/utils/logger';
import { getApp } from '@react-native-firebase/app';
import {
  fetchAndActivate,
  getAll,
  getRemoteConfig,
  setConfigSettings,
} from '@react-native-firebase/remote-config';
import { useCallback, useEffect, useState } from 'react';

const remoteConfig = getRemoteConfig(getApp());

void setConfigSettings(remoteConfig, {
  // 1 minute in dev, 10 minutes in prod
  minimumFetchIntervalMillis: __DEV__ ? 60 : 600,
});

export interface RemoteConfigSchema {
  splash: { '7tvUnavailable': boolean; app: boolean };

  /**
   * Minimum version of the app required for preview track (TestFlight/internal testing)
   */
  minimumPreviewVersion: string;

  /**
   * Minimum version of the app required for production track (App Store/Play Store)
   */
  minimumProductionVersion: string;

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
  minimumPreviewVersion: '0.0.0',
  minimumProductionVersion: '0.0.0',
  statusPageUrl: 'https://status.foam-app.com',
  websiteUrl: 'https://foam-app.com',
} satisfies Record<RemoteConfigKey, string>;

const jsonKeys: RemoteConfigKey[] = ['splash'];

function parseConfigValue<K extends RemoteConfigKey>(
  key: K,
  raw: string,
): RemoteConfigSchema[K] {
  if (jsonKeys.includes(key)) {
    try {
      return JSON.parse(raw) as RemoteConfigSchema[K];
    } catch {
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
          value: parseConfigValue(key, raw),
          source: 'default' as ConfigSource,
        },
      ];
    }),
  ) as RemoteConfigType;
}

remoteConfig.setDefaults(defaultRemoteConfig).catch(e => {
  sentryService.addBreadcrumb({
    message: 'Failed to set default remote config values',
    category: 'firebase.remote-config.default-set',
    level: 'error',
  });
  sentryService.captureException(e);
});

export type UseRemoteConfigResult = {
  config: RemoteConfigType;
  refetch: () => Promise<boolean>;
  isRefetching: boolean;
};

export function useRemoteConfig(): UseRemoteConfigResult {
  const [config, setConfig] = useState<RemoteConfigType>(
    buildConfigFromDefaults,
  );
  const [isRefetching, setIsRefetching] = useState(false);

  const updateConfig = useCallback(() => {
    const allConfig = getAll(remoteConfig);
    const newConfig = Object.fromEntries(
      Object.entries(allConfig)
        .filter(([key]) => key in defaultRemoteConfig)
        .map(([key, entry]) => [
          key,
          {
            raw: entry.asString(),
            value: parseConfigValue(key as RemoteConfigKey, entry.asString()),
            source: entry.getSource(),
          },
        ]),
    ) as RemoteConfigType;
    setConfig(newConfig);
  }, []);

  const refetch = useCallback(async (): Promise<boolean> => {
    setIsRefetching(true);
    try {
      const activated = await fetchAndActivate(remoteConfig);
      logger.remoteConfig.info('fetchAndActivate (manual)', {
        activated,
        message: activated
          ? 'Fetched new config from server'
          : 'Using cached config (no new data)',
      });
      updateConfig();
      return activated;
    } catch (error) {
      logger.remoteConfig.error('fetchAndActivate failed', error);
      sentryService.addBreadcrumb({
        message: 'Failed to update remote config values',
        category: 'firebase.remote-config.update-values',
      });
      sentryService.captureException(error);
      return false;
    } finally {
      setIsRefetching(false);
    }
  }, [updateConfig]);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { config, refetch, isRefetching };
}
