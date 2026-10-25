import type { PaintCanvasRepeat } from '@app/types/seven-tv/cosmetics';

export type PaintLayerTileMode = 'clamp' | 'decal' | 'mirror' | 'repeat';

export type PaintLayerTiling = {
  tx: PaintLayerTileMode;
  ty: PaintLayerTileMode;
};

export function paintLayerTileModes(
  canvasRepeat: PaintCanvasRepeat,
): PaintLayerTiling {
  switch (canvasRepeat) {
    case 'repeat-x':
      return { tx: 'repeat', ty: 'decal' };
    case 'repeat-y':
      return { tx: 'decal', ty: 'repeat' };
    default:
      return { tx: 'repeat', ty: 'repeat' };
  }
}
