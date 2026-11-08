import { swapSevenTvPaintLayerExt } from '@app/utils/emote/cdn/sevenTv';

/**
 * Skia decodes WebP but not AVIF, so swap 7TV CDN AVIF layer urls to their
 * WebP sibling.
 */
export function skiaDecodableLayerUrl(url: string): string {
  return swapSevenTvPaintLayerExt(url, 'avif', 'webp');
}
