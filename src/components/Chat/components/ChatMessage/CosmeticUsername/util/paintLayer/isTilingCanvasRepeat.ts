import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

/**
 * True when the layer's texture is meant to tile across the paint area
 * (CSS `background-repeat` semantics) rather than stretch to fill it.
 */
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
