import type { EmoteImageScale } from '@app/types/emote';

export interface ScaleSlugs<TScale extends EmoteImageScale> {
  scales: TScale[];
  toSlug: (scale: EmoteImageScale) => string;
  fromSlug: (slug: string | undefined) => TScale | undefined;
}

export function createScaleSlugs<TScale extends EmoteImageScale>(
  slugs: Record<TScale, string>,
  fallback: NoInfer<TScale>,
): ScaleSlugs<TScale> {
  // SAFETY: every caller passes an object literal keyed only by TScale, so Object.keys yields no other key.
  const scales = Object.keys(slugs) as TScale[];

  const isServedScale = (scale: EmoteImageScale): scale is TScale =>
    scale in slugs;

  return {
    scales,
    toSlug: scale => slugs[isServedScale(scale) ? scale : fallback],
    fromSlug: slug => scales.find(scale => slugs[scale] === slug),
  };
}
