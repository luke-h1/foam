import { measureFunction } from 'reassure';

import { buildPaintedUsernameHtml } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-html';
import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chat-scale';

import {
  multiLayerPaint,
  paintedUsernames,
} from '../__fixtures__/paint.perf.fixture';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('paintHtml performance', () => {
  test('builds painted-username HTML for a multi-layer paint batch', async () => {
    await measureFunction(() => {
      for (const username of paintedUsernames) {
        buildPaintedUsernameHtml({
          displayUsername: `${username}: `,
          paint: multiLayerPaint,
          fallbackColor: '#9146FF',
          fontSize: chatLineMetrics.comfortable.fontSize,
          lineHeight: chatLineMetrics.comfortable.lineHeight,
        });
      }
    }, MEASURE_OPTIONS);
  });
});
