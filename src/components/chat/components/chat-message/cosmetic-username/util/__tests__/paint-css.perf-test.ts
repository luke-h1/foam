import { measureFunction } from 'reassure';

import { buildPaintCssDeclarations } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/build-paint-css-declarations';
import { paintCssDeclarationsToBlock } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/paint-css-declarations-to-block';

import { multiLayerPaint } from '../__fixtures__/paint.perf.fixture';

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
