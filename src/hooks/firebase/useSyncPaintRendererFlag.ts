import { useEffect } from 'react';

import { paintRendererFlag$ } from '@app/store/preferenceStore';

import { useRemoteConfig } from './useRemoteConfig';

export function useSyncPaintRendererFlag(): void {
  const { config } = useRemoteConfig();
  const flag = config.sevenTvPaintRenderer.value;

  useEffect(() => {
    paintRendererFlag$.set(flag === 'skia' || flag === 'off' ? flag : 'native');
  }, [flag]);
}
