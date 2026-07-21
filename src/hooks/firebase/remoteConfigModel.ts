import { logger } from '@app/utils/logger';

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
   * Logins allowed to see the "update app" button in Settings. An empty array
   * means the button is shown to everyone.
   */
  updateAppButtonAllowedUsers: string[];

  bundleButtonEnabled: {
    ios: {
      development: boolean;
      internal: boolean;
      testflight: boolean;
      production: boolean;
      e2e: boolean;
    };
  };

  /**
   * A/B test variant assignments keyed by experiment name. Firebase A/B Testing
   * sets this per user; the client reads it via `useExperiment`.
   */
  experiments: Record<string, string>;

  /**
   * Light-mode rollout gate per release track. Off = the app renders dark
   * regardless of the persisted theme preference.
   */
  lightModeEnabled: {
    development: boolean;
    internal: boolean;
    testflight: boolean;
    production: boolean;
    e2e: boolean;
  };

  sevenTvPaintRenderer: 'off' | 'native' | 'skia';
}

export type RemoteConfigKey = keyof RemoteConfigSchema;

export type MinimumVersionTrack =
  keyof RemoteConfigSchema['minimumVersion']['ios'];

export type BundleUpdateButtonEnabled =
  keyof RemoteConfigSchema['bundleButtonEnabled']['ios'];

export type ConfigSource = 'default' | 'remote' | 'static';

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
  updateAppButtonAllowedUsers: '[]',
  experiments: '{}',
  lightModeEnabled:
    '{ "development": true, "internal": true, "testflight": false, "production": false, "e2e": false }',
  sevenTvPaintRenderer: 'native',
  bundleButtonEnabled:
    '{ "ios": { "development": false, "internal": true, "testflight": false, "production": false, "e2e": false }}',
} satisfies Record<RemoteConfigKey, string>;

const jsonKeys: RemoteConfigKey[] = [
  'splash',
  'minimumVersion',
  'admins',
  'updateAppButtonAllowedUsers',
  'experiments',
  'lightModeEnabled',
  'bundleButtonEnabled',
];

export function parseRemoteConfigValue<K extends RemoteConfigKey>(
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

export function buildRemoteConfigFromDefaults(
  source: ConfigSource,
): RemoteConfigType {
  return Object.fromEntries(
    (Object.keys(defaultRemoteConfig) as RemoteConfigKey[]).map(key => {
      const raw = defaultRemoteConfig[key];
      return [
        key,
        {
          raw,
          value: parseRemoteConfigValue(key, raw),
          source,
        } satisfies RemoteConfigEntry<RemoteConfigSchema[RemoteConfigKey]>,
      ];
    }),
  ) as RemoteConfigType;
}

export type UseRemoteConfigResult = {
  config: RemoteConfigType;
  refetch: () => Promise<boolean>;
  isRefetching: boolean;
  isLoading: boolean;
};
