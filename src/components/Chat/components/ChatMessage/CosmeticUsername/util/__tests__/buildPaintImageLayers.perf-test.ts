import { measureFunction } from 'reassure';

import { buildPaintImageLayers } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/skiaPaintedUsernameRasterizer';

import { paintImageLayerLayout } from './__fixtures__/paint.perf.fixture';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('buildPaintImageLayers performance', () => {
  test('maps multi-layer paints into skia overlay descriptors', async () => {
    await measureFunction(() => {
      for (let i = 0; i < 200; i += 1) {
        buildPaintImageLayers(paintImageLayerLayout);
      }
    }, MEASURE_OPTIONS);
  });
});
