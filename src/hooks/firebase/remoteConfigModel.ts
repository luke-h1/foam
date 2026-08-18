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
  'bundleButtonEnabled',
];

export function parseRemoteConfigValue<K extends RemoteConfigKey>(
  key: K,
  raw: string,
): RemoteConfigSchema[K] {
  if (jsonKeys.includes(key)) {
    try {
      // SAFETY: `key` is a JSON key, so its remote string encodes the schema shape for `key`.
      return JSON.parse(raw) as RemoteConfigSchema[K];
    } catch {
      logger.remoteConfig.error(`Failed to parse JSON for key: ${key}`, {
        raw,
      });
      // SAFETY: `defaultRemoteConfig[key]` is a literal in this file that encodes the schema shape for `key`.
      return JSON.parse(defaultRemoteConfig[key]) as RemoteConfigSchema[K];
    }
  }
  // SAFETY: keys outside `jsonKeys` are string-typed in `RemoteConfigSchema`; the remote string is used verbatim.
  return raw as RemoteConfigSchema[K];
}

function buildDefaultEntry<K extends RemoteConfigKey>(
  key: K,
  source: ConfigSource,
): RemoteConfigEntry<RemoteConfigSchema[K]> {
  const raw = defaultRemoteConfig[key];
  return { raw, value: parseRemoteConfigValue(key, raw), source };
}

export function buildRemoteConfigFromDefaults(
  source: ConfigSource,
): RemoteConfigType {
  return {
    splash: buildDefaultEntry('splash', source),
    minimumVersion: buildDefaultEntry('minimumVersion', source),
    statusPageUrl: buildDefaultEntry('statusPageUrl', source),
    websiteUrl: buildDefaultEntry('websiteUrl', source),
    admins: buildDefaultEntry('admins', source),
    updateAppButtonAllowedUsers: buildDefaultEntry(
      'updateAppButtonAllowedUsers',
      source,
    ),
    experiments: buildDefaultEntry('experiments', source),
    sevenTvPaintRenderer: buildDefaultEntry('sevenTvPaintRenderer', source),
    bundleButtonEnabled: buildDefaultEntry('bundleButtonEnabled', source),
  };
}

export type UseRemoteConfigResult = {
  config: RemoteConfigType;
  refetch: () => Promise<boolean>;
  isRefetching: boolean;
  isLoading: boolean;
};
