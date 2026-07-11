import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

import { isTilingCanvasRepeat } from '../isTilingCanvasRepeat';

describe('isTilingCanvasRepeat', () => {
  test('layer.repeat forces tiling regardless of canvas_repeat', () => {
    expect(isTilingCanvasRepeat('unset', true)).toBe(true);
    expect(isTilingCanvasRepeat('no-repeat', true)).toBe(true);
  });

  test('tiling canvas_repeat values tile without layer.repeat', () => {
    const tiling: PaintCanvasRepeat[] = [
      'repeat',
      'repeat-x',
      'repeat-y',
      'round',
      'space',
    ];
    for (const canvasRepeat of tiling) {
      expect(isTilingCanvasRepeat(canvasRepeat, false)).toBe(true);
    }
  });

  test('non-tiling canvas_repeat values stretch to fill', () => {
    const nonTiling: PaintCanvasRepeat[] = ['', 'no-repeat', 'revert', 'unset'];
    for (const canvasRepeat of nonTiling) {
      expect(isTilingCanvasRepeat(canvasRepeat, false)).toBe(false);
    }
  });
});
