import { swapSevenTvPaintLayerExt } from '@app/utils/emote/cdn/sevenTv';

/**
 * WKWebView fails some 7TV WebP paints; swap CDN `.webp` to its `.avif` sibling.
 */
export function webKitSafeLayerImageUrl(url: string): string {
  return swapSevenTvPaintLayerExt(url, 'webp', 'avif');
}
