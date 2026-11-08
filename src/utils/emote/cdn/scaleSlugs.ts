import type { EmoteImageScale } from '@app/types/emote';

export interface ScaleSlugs<TScale extends EmoteImageScale> {
  scales: TScale[];
  /**
   * A scale the CDN does not serve maps to the slug of `fallback`.
   */
  toSlug: (scale: EmoteImageScale) => string;
  fromSlug: (slug: string | undefined) => TScale | undefined;
}

/**
 * For a CDN that names each scale with its own path slug, such as FFZ `4` or
 * Twitch `3.0`.
 */
export function createScaleSlugs<TScale extends EmoteImageScale>(
  slugs: Record<TScale, string>,
  fallback: NoInfer<TScale>,
): ScaleSlugs<TScale> {
  // SAFETY: Object.keys of a Record<TScale, string> returns exactly its keys.
  const scales = Object.keys(slugs) as TScale[];

  const isServedScale = (scale: EmoteImageScale): scale is TScale =>
    scale in slugs;

  return {
    scales,
    toSlug: scale => slugs[isServedScale(scale) ? scale : fallback],
    fromSlug: slug => scales.find(scale => slugs[scale] === slug),
  };
}
