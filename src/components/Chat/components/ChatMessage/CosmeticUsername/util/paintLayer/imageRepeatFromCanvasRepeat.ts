import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

import { isTilingCanvasRepeat } from './isTilingCanvasRepeat';

export function imageRepeatFromCanvasRepeat(
  canvasRepeat: PaintCanvasRepeat,
  layerRepeat: boolean,
): 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' {
  return isTilingCanvasRepeat(canvasRepeat, layerRepeat) ? 'none' : 'fill';
}
