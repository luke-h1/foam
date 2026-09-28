import type { PaintData, PaintTextStroke } from '@app/types/seventv/cosmetics';

export function getPaintTextStroke(paint: PaintData): PaintTextStroke | null {
  const stroke = paint.textStyle?.stroke;
  return stroke?.width ? stroke : null;
}
