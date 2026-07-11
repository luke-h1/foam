import { useEffect } from 'react';

import { paintRendererRollout$ } from './paintRendererRollout';
import { useExperiment } from './useExperiment';

export function useSyncPaintRendererExperiment(): void {
  const variant = useExperiment('sevenTvPaintRenderer');

  useEffect(() => {
    paintRendererRollout$.set(variant === 'skia' ? 'skia' : 'native');
  }, [variant]);
}
