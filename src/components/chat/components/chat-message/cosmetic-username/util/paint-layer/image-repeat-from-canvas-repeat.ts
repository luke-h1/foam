import type { PaintCanvasRepeat } from '@app/types/seven-tv/cosmetics';

import { isTilingCanvasRepeat } from './is-tiling-canvas-repeat';

export function imageRepeatFromCanvasRepeat(
  canvasRepeat: PaintCanvasRepeat,
  layerRepeat: boolean,
): 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' {
  return isTilingCanvasRepeat(canvasRepeat, layerRepeat) ? 'none' : 'fill';
}
