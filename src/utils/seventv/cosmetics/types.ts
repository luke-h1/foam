import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintFunction,
  PaintStop,
} from '@app/types/seventv/cosmetics';

export type PaintGradientLayer = {
  function: PaintFunction;
  canvas_repeat?: string;
  size?: [number, number] | null;
  at?: [number, number];
  stops?: IndexedCollection<PaintStop> | PaintStop[];
  image_url?: string;
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- mirrors the 7TV paint API field name; see normalizeSevenTvPaint.ts
  shape?: string;
  angle?: number;
  repeat?: boolean;
  opacity?: number;
};

export type RawSevenTvPaintInput = Partial<PaintData> & {
  id: string;
  ref_id?: string;
  gradients?: PaintGradientLayer[];
};
