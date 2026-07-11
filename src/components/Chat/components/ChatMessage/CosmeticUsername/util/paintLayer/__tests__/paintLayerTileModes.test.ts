import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

import {
  type PaintLayerTileMode,
  paintLayerTileModes,
} from '../paintLayerTileModes';

describe('paintLayerTileModes', () => {
  test('repeat-x tiles horizontally and clamps to transparent vertically', () => {
    expect(paintLayerTileModes('repeat-x')).toEqual<{
      tx: PaintLayerTileMode;
      ty: PaintLayerTileMode;
    }>({ tx: 'repeat', ty: 'decal' });
  });

  test('repeat-y tiles vertically and clamps to transparent horizontally', () => {
    expect(paintLayerTileModes('repeat-y')).toEqual<{
      tx: PaintLayerTileMode;
      ty: PaintLayerTileMode;
    }>({ tx: 'decal', ty: 'repeat' });
  });

  test('every other repeat mode tiles both axes', () => {
    const bothAxes: PaintCanvasRepeat[] = ['repeat', 'round', 'space', 'unset'];
    for (const canvasRepeat of bothAxes) {
      expect(paintLayerTileModes(canvasRepeat)).toEqual<{
        tx: PaintLayerTileMode;
        ty: PaintLayerTileMode;
      }>({ tx: 'repeat', ty: 'repeat' });
    }
  });
});
