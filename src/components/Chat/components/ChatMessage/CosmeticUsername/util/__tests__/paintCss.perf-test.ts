import { measureFunction } from 'reassure';

import { buildPaintCssDeclarations } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintCss/buildPaintCssDeclarations';
import { paintCssDeclarationsToBlock } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintCss/paintCssDeclarationsToBlock';

import { multiLayerPaint } from './__fixtures__/paint.perf.fixture';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('paintCss performance', () => {
  test('builds CSS declarations for a multi-layer paint', async () => {
    await measureFunction(() => {
      for (let i = 0; i < 80; i += 1) {
        paintCssDeclarationsToBlock(buildPaintCssDeclarations(multiLayerPaint));
      }
    }, MEASURE_OPTIONS);
  });
});
