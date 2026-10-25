import type { PaintShadow } from '@app/types/seven-tv/cosmetics';

export function paintShadowKey(shadow: PaintShadow): string {
  return `paint-drop-shadow-${shadow.color}-${shadow.x_offset}-${shadow.y_offset}-${shadow.radius}`;
}
