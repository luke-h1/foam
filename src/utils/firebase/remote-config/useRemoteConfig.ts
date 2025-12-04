import '@react-native-firebase/installations';
import { useEffectOnce } from '@app/hooks/useEffectOnce';
import { sentryService } from '@app/services/sentry-service';
import { logger } from '@app/utils/logger';
import { OpenStringUnion } from '@app/utils/typescript';
import { getApp } from '@react-native-firebase/app';
import {
  fetchAndActivate,
  getAll,
  getRemoteConfig,
  onConfigUpdated,
} from '@react-native-firebase/remote-config';
import { useCallback, useState } from 'react';

const remoteConfig = getRemoteConfig(getApp());

const defaultRemoteConfig = {
  /**
   * Maintenance config
   */
  splash: '{"7tvUnavailable": false, "foamMaintenance": false}',
  /**
   * Minimum version constraint to force users to update
   */
  minimumVersion: '0.0.0',

  statusPageUrl: 'https://status.foam-app.com',
  websiteUrl: 'https://foam-app.com',
};

export type RemoteConfigKey = OpenStringUnion<keyof typeof defaultRemoteConfig>;

remoteConfig.setDefaults(defaultRemoteConfig).catch(e => {
  sentryService.addBreadcrumb({
    message: 'Failed to set default remote config values',
    category: 'firebase.remote-config.default-set',
    level: 'error',
  });
  sentryService.captureException(e);
});

export type RemoteConfigType = Record<
  RemoteConfigKey,
  { value: string; source: 'default' | 'remote' | 'static' }
>;

export function useRemoteConfig(): RemoteConfigType {
  const [config, setConfig] = useState<RemoteConfigType>();

  const updateConfig = useCallback(() => {
    const newConfig = Object.fromEntries(
      Object.entries(getAll(remoteConfig)).map(([key, value]) => [
        key,
        { value: value.asString(), source: value.getSource() },
      ]),
    ) as RemoteConfigType;
    setConfig(newConfig);
  }, []);

  useEffectOnce(() => {
    const initRemoteConfig = async () => {
      try {
        await fetchAndActivate(remoteConfig);
        updateConfig();
      } catch (error) {
        sentryService.addBreadcrumb({
          message: 'Failed to update remote config values',
          category: 'firebase.remote-config.update-values',
        });

        sentryService.captureException(error);
      }
    };
    void initRemoteConfig();

    // eslint-disable-next-line no-shadow
    const unsub = onConfigUpdated(remoteConfig, config => {
      void initRemoteConfig();
      logger.remoteConfig.info('updated remote config', config);
    });

    return () => unsub();
  });

  return config as RemoteConfigType;
}
