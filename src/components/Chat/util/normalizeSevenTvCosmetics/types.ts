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
  shape?: string;
  angle?: number;
  repeat?: boolean;
};

export type RawSevenTvPaintInput = Partial<PaintData> & {
  id: string;
  ref_id?: string;
  gradients?: PaintGradientLayer[];
};
