import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

export type PaintLayerTileMode = 'clamp' | 'decal' | 'mirror' | 'repeat';

export function paintLayerTileModes(canvasRepeat: PaintCanvasRepeat): {
  tx: PaintLayerTileMode;
  ty: PaintLayerTileMode;
} {
  switch (canvasRepeat) {
    case 'repeat-x':
      return { tx: 'repeat', ty: 'decal' };
    case 'repeat-y':
      return { tx: 'decal', ty: 'repeat' };
    default:
      return { tx: 'repeat', ty: 'repeat' };
  }
}
