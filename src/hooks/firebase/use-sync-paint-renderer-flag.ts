import { useEffect } from 'react';

import {
  paintRendererFlag$,
  resolvePlatformPaintRenderer,
} from '@app/store/preference-store';

import { useRemoteConfig } from './use-remote-config';

export function useSyncPaintRendererFlag(): void {
  const { config } = useRemoteConfig();
  const flag = config.sevenTvPaintRenderer.value;

  useEffect(() => {
    switch (flag) {
      case 'off':
        paintRendererFlag$.set('off');
        break;
      case 'skia':
        paintRendererFlag$.set(resolvePlatformPaintRenderer('skia'));
        break;
      default:
        paintRendererFlag$.set('native');
        break;
    }
  }, [flag]);
}
