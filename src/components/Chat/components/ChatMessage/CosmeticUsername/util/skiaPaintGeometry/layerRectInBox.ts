export interface LayerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Absolute-pixel form of `getLayerLayoutStyle`'s percentage maths:
 * offset = (box - layer) * p, per CSS `background-position: p%`.
 */
export function layerRectInBox(
  at: [number, number] | null,
  size: [number, number] | null,
  width: number,
  height: number,
): LayerRect {
  const sizeX = size?.[0] ?? 1;
  const sizeY = size?.[1] ?? 1;
  const posX = at?.[0] ?? 0;
  const posY = at?.[1] ?? 0;

  return {
    x: (1 - sizeX) * posX * width,
    y: (1 - sizeY) * posY * height,
    width: sizeX * width,
    height: sizeY * height,
  };
}
