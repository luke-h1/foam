import type { IndexedCollection } from '@app/services/ws/util/indexed-collection';
import type {
  PaintData,
  PaintFunction,
  PaintStop,
} from '@app/types/seven-tv/cosmetics';

export type PaintGradientLayer = {
  function: PaintFunction;
  canvas_repeat?: string | undefined;
  size?: [number, number] | null | undefined;
  at?: [number, number] | undefined;
  stops?: IndexedCollection<PaintStop> | PaintStop[] | undefined;
  image_url?: string | undefined;
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- mirrors the 7TV paint API field name; see normalizeSevenTvPaint.ts
  shape?: string | undefined;
  angle?: number | undefined;
  repeat?: boolean | undefined;
  opacity?: number | undefined;
};

export type RawSevenTvPaintInput = Partial<PaintData> & {
  id: string;
  ref_id?: string;
  gradients?: PaintGradientLayer[];
};
