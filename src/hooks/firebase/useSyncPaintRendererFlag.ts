import { useEffect } from 'react';
import { Platform } from 'react-native';

import { paintRendererFlag$ } from '@app/store/preferenceStore';

import { useRemoteConfig } from './useRemoteConfig';

export function useSyncPaintRendererFlag(): void {
  const { config } = useRemoteConfig();
  const flag = config.sevenTvPaintRenderer.value;

  useEffect(() => {
    if (flag === 'off') {
      paintRendererFlag$.set('off');
      return;
    }
    paintRendererFlag$.set(
      flag === 'skia' && Platform.OS !== 'web' ? 'skia' : 'native',
    );
  }, [flag]);
}
