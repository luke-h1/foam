import {
  buildSevenTvFileUrl,
  parseSevenTvFileUrl,
} from '@app/utils/emote/cdn/sevenTv';

/**
 * `{n}x.{ext}` URLs advertise sizes/formats the CDN doesn't always serve, so
 * build an ordered candidate list: original, alternate format, sizes down to 2x.
 */
export function buildImageFallbackChain(url: string): string[] {
  const file = parseSevenTvFileUrl(url);

  if (!file) {
    return [url];
  }

  const formats = [...new Set([file.ext, 'webp', 'avif'])];
  const size = Number(file.scale[0]);
  const minScale = Math.min(2, size);

  const chain = new Set<string>();

  for (let scale = size; scale >= minScale; scale -= 1) {
    for (const ext of formats) {
      chain.add(
        buildSevenTvFileUrl({
          ...file,
          // SAFETY: scale walks down from a parsed 1-4 scale.
          scale: `${scale}x` as typeof file.scale,
          ext,
        }),
      );
    }
  }

  return [...chain];
}
