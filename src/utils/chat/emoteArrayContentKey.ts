import type { SanitisedEmote } from '@app/types/emote';

/**
 * Content-derived key so a rebuilt array with unchanged emotes keys the same;
 * hashed rather than joined so 5k emotes don't build a huge string per rebuild.
 */
const contentKeyCache = new WeakMap<SanitisedEmote[], string>();

const emoteHashCache = new WeakMap<SanitisedEmote, readonly [number, number]>();

/**
 * Delimiters stop field-boundary collisions; the presence flags below, not
 * the delimiters alone, make the layout unambiguous.
 */
const FIELD_SEPARATOR = 0x1f;

/**
 * Presence flags stop a skipped optional field from letting `original_name`
 * occupy a `url`'s slot and key the same.
 */
const HAS_ALIAS = 1;

const HAS_URL = 2;
const IS_ZERO_WIDTH = 4;

function getEmoteHash(emote: SanitisedEmote): readonly [number, number] {
  const cached = emoteHashCache.get(emote);

  if (cached !== undefined) {
    return cached;
  }

  const hasAlias = Boolean(
    emote.original_name && emote.original_name !== emote.name,
  );

  const hasUrl = Boolean(emote.url);

  const flags =
    (hasAlias ? HAS_ALIAS : 0) |
    (hasUrl ? HAS_URL : 0) |
    (emote.zero_width ? IS_ZERO_WIDTH : 0);

  let h1 = Math.imul(2_166_136_261 ^ flags, 16_777_619);
  let h2 = (Math.imul(5381, 33) ^ flags) >>> 0;

  const mixString = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      const c = value.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16_777_619);
      h2 = (Math.imul(h2, 33) ^ c) >>> 0;
    }

    h1 = Math.imul(h1 ^ FIELD_SEPARATOR, 16_777_619);
    h2 = (Math.imul(h2, 33) ^ FIELD_SEPARATOR) >>> 0;
  };

  mixString(emote.id);
  mixString(emote.name);

  if (hasAlias) {
    mixString(emote.original_name);
  }

  if (hasUrl) {
    mixString(emote.url);
  }

  const pair: readonly [number, number] = [h1 >>> 0, h2];
  emoteHashCache.set(emote, pair);
  return pair;
}

export function getEmoteArrayContentKey(emotes: SanitisedEmote[]): string {
  const cached = contentKeyCache.get(emotes);

  if (cached !== undefined) {
    return cached;
  }

  let h1 = 2_166_136_261 >>> 0;
  let h2 = 5381 >>> 0;

  for (const emote of emotes) {
    const [e1, e2] = getEmoteHash(emote);
    h1 = Math.imul(h1 ^ e1, 16_777_619) >>> 0;
    h2 = (Math.imul(h2, 33) ^ e2) >>> 0;
  }

  const key = `${emotes.length}.${h1.toString(36)}.${h2.toString(36)}`;
  contentKeyCache.set(emotes, key);
  return key;
}
