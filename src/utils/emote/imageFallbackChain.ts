/**
 * 7TV (and other `{n}x.{ext}`-shaped) emote/badge URLs advertise sizes and
 * formats their CDN doesn't always actually serve — a badge whose host metadata
 * lists a `4x` file still 404s on `4x.webp`. Given such a URL, return an ordered
 * list of candidate URLs to try in turn: the original first, then the alternate
 * format at the same size (webp <-> avif), then the same walk at each smaller
 * size. A URL that doesn't match the variant shape (Twitch, BTTV, FFZ) has no
 * derivable variants, so it's returned on its own.
 */
const VARIANT_FILENAME_PATTERN =
  /^(?<base>.+\/)(?<size>[1-4])x(?<staticSuffix>_static)?\.(?<ext>avif|webp|png|gif)(?<query>\?.*)?$/i;

const FALLBACK_FORMATS = ['webp', 'avif'] as const;

export function buildImageFallbackChain(url: string): string[] {
  const groups = VARIANT_FILENAME_PATTERN.exec(url)?.groups;
  if (!groups?.base || !groups.size || !groups.ext) {
    return [url];
  }

  const base = groups.base;
  const staticSuffix = groups.staticSuffix ?? '';
  const query = groups.query ?? '';
  const size = Number(groups.size);
  const ext = groups.ext.toLowerCase();

  const formats = [...new Set([ext, ...FALLBACK_FORMATS])];

  const chain: string[] = [];
  const seen = new Set<string>();
  for (let scale = size; scale >= 1; scale -= 1) {
    for (const format of formats) {
      const candidate = `${base}${scale}x${staticSuffix}.${format}${query}`;
      if (!seen.has(candidate)) {
        seen.add(candidate);
        chain.push(candidate);
      }
    }
  }

  return chain;
}
