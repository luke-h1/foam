import type { SanitisedEmote } from '@app/types/emote';

/**
 * A key for an emote array derived from what parsing actually consumes, so a
 * rebuilt array with unchanged content keys identically and the parse caches
 * stay warm across identity churn (7TV events and channel-load settles
 * replace these arrays wholesale). Covers every field a cached parse bakes
 * in: id/name/original_name drive tokenization, url is embedded in the parts,
 * zero_width changes overlay composition. Hashed (dual FNV-1a/djb2 plus
 * length) instead of joined so a 5k-emote channel array doesn't build a
 * multi-hundred-KB string per rebuild.
 */
const contentKeyCache = new WeakMap<SanitisedEmote[], string>();

/**
 * Field and record delimiters. Without them the fields concatenate into one
 * byte stream, so `{id:'25',name:'Kappa'}` and `{id:'2',name:'5Kappa'}` key
 * identically and one set's parse cache resolves the other set's emotes.
 * Both are C0 controls, which cannot occur in an emote id, name or url.
 */
const FIELD_SEPARATOR = 0x1f;
const RECORD_SEPARATOR = 0x1e;

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
    [h1, h2] = mixString(h1, h2, emote.id);
    [h1, h2] = mixString(h1, h2, emote.name);
    if (emote.original_name && emote.original_name !== emote.name) {
      [h1, h2] = mixString(h1, h2, emote.original_name);
    }
    if (emote.url) {
      [h1, h2] = mixString(h1, h2, emote.url);
    }
    [h1, h2] = mixByte(h1, h2, emote.zero_width ? 31 : 7);
    [h1, h2] = mixByte(h1, h2, RECORD_SEPARATOR);
  }

  const key = `${emotes.length}.${h1.toString(36)}.${h2.toString(36)}`;
  contentKeyCache.set(emotes, key);
  return key;
}
