import { useEffect } from 'react';
import { Platform } from 'react-native';

import { paintRendererFlag$ } from '@app/store/preferenceStore';

import { useRemoteConfig } from './useRemoteConfig';

export function useSyncPaintRendererFlag(): void {
  const { config } = useRemoteConfig();
  const flag = config.sevenTvPaintRenderer.value;

  useEffect(() => {
    switch (flag) {
      case 'off':
        paintRendererFlag$.set('off');
        break;
      case 'skia':
        paintRendererFlag$.set(Platform.OS === 'web' ? 'native' : 'skia');
        break;
      default:
        paintRendererFlag$.set('native');
        break;
    }
  }, [flag]);
}
