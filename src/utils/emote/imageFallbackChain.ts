/**
 * `{n}x.{ext}` URLs advertise sizes/formats the CDN doesn't always serve, so
 * build an ordered candidate list: original, alternate format, sizes down to 2x.
 */
const VARIANT_FILENAME_PATTERN =
  /^(?<base>.+\/)(?<size>[1-4])x(?<staticSuffix>_static)?\.(?<ext>avif|webp|png|gif)(?<query>\?.*)?$/i;

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

  const formats = [...new Set([ext, 'webp', 'avif'])];

  const chain: string[] = [];
  const seen = new Set<string>();
  const minScale = Math.min(2, size);
  for (let scale = size; scale >= minScale; scale -= 1) {
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
