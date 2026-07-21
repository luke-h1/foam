import { useEffect } from 'react';

import { lightModeEnabled$ } from '@app/store/preferences/state';

import { useRemoteConfig } from './useRemoteConfig';

const variant = process.env.EXPO_PUBLIC_APP_VARIANT || 'development';

export function useSyncLightModeFlag(): void {
  const { config } = useRemoteConfig();
  const enabled = config.lightModeEnabled.value[variant] ?? false;

  useEffect(() => {
    lightModeEnabled$.set(enabled);
  }, [enabled]);
}
