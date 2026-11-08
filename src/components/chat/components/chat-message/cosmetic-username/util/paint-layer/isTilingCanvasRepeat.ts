import type { PaintCanvasRepeat } from '@app/types/seven-tv/cosmetics';

export function isTilingCanvasRepeat(
  canvasRepeat: PaintCanvasRepeat,
  layerRepeat: boolean,
): boolean {
  return (
    layerRepeat ||
    canvasRepeat === 'repeat' ||
    canvasRepeat === 'repeat-x' ||
    canvasRepeat === 'repeat-y' ||
    canvasRepeat === 'round' ||
    canvasRepeat === 'space'
  );
}
