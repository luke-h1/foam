import type { SanitisedEmote } from '@app/types/emote';

/**
 * Content-derived key so a rebuilt array with unchanged emotes keys the same;
 * hashed rather than joined so 5k emotes don't build a huge string per rebuild.
 */
const contentKeyCache = new WeakMap<SanitisedEmote[], string>();

/**
 * Delimiters stop field-boundary collisions; the presence flags below, not
 * the delimiters alone, make the layout unambiguous.
 */
const FIELD_SEPARATOR = 0x1f;
const RECORD_SEPARATOR = 0x1e;

/**
 * Presence flags stop a skipped optional field from letting `original_name`
 * occupy a `url`'s slot and key the same.
 */
const HAS_ALIAS = 1;
const HAS_URL = 2;
const IS_ZERO_WIDTH = 4;

function mixByte(h1: number, h2: number, byte: number): [number, number] {
  return [((h1 ^ byte) * 16777619) >>> 0, ((h2 * 33) ^ byte) >>> 0];
}

function mixString(h1: number, h2: number, value: string): [number, number] {
  for (let i = 0; i < value.length; i += 1) {
    const c = value.charCodeAt(i);
    h1 = ((h1 ^ c) * 16777619) >>> 0;
    h2 = ((h2 * 33) ^ c) >>> 0;
  }
  return mixByte(h1, h2, FIELD_SEPARATOR);
}

export function getEmoteArrayContentKey(emotes: SanitisedEmote[]): string {
  const cached = contentKeyCache.get(emotes);
  if (cached !== undefined) {
    return cached;
  }

  let h1 = 2166136261 >>> 0;
  let h2 = 5381 >>> 0;
  for (const emote of emotes) {
    const hasAlias = Boolean(
      emote.original_name && emote.original_name !== emote.name,
    );
    const hasUrl = Boolean(emote.url);

    [h1, h2] = mixByte(
      h1,
      h2,
      (hasAlias ? HAS_ALIAS : 0) |
        (hasUrl ? HAS_URL : 0) |
        (emote.zero_width ? IS_ZERO_WIDTH : 0),
    );
    [h1, h2] = mixString(h1, h2, emote.id);
    [h1, h2] = mixString(h1, h2, emote.name);
    if (hasAlias) {
      [h1, h2] = mixString(h1, h2, emote.original_name);
    }
    if (hasUrl) {
      [h1, h2] = mixString(h1, h2, emote.url);
    }
    [h1, h2] = mixByte(h1, h2, RECORD_SEPARATOR);
  }

  const key = `${emotes.length}.${h1.toString(36)}.${h2.toString(36)}`;
  contentKeyCache.set(emotes, key);
  return key;
}
