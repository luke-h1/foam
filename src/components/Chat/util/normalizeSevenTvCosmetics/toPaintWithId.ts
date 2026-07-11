import type { PaintData } from '@app/types/seventv/cosmetics';

import { normalizeSevenTvPaint } from './normalizeSevenTvPaint';
import type { RawSevenTvPaintInput } from './types';

export function toPaintWithId(paintData: RawSevenTvPaintInput): PaintData {
  return normalizeSevenTvPaint(paintData);
}
