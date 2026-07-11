import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { parseWordLinkParts } from '@app/utils/chat/replaceTextWithEmotes/parseWordLinkParts';

import { queueMentionLoginsFromParts } from './mentionLoginResolver/queueMentionLoginsFromParts';
import type { ParsedPart } from './parsedPart';
import { applyMentionLoginCasing } from './resolveMentionLogin/applyMentionLoginCasing';
import { stripInvisibleChars } from './stripInvisibleChars';

interface EmoteProcessorParams {
  inputString: string;
  userstate: UserStateTags | null;
  emojiEmotes?: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  sevenTvPersonalEmotes?: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
  twitchChannelEmotes: SanitisedEmote[];
  twitchSubscriberEmotes?: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
}

const cache = new Map<string, ParsedPart[]>();
const MAX_CACHE_SIZE = 1000;
const emoteArrayIds = new WeakMap<SanitisedEmote[], number>();
const baseCollectionCache = new Map<string, EmoteCollection>();

const MAX_BASE_COLLECTION_CACHE_SIZE = 4;
const scopedLookupCache = new Map<
  string,
  (name: string) => SanitisedEmote | undefined
>();
const MAX_SCOPED_LOOKUP_CACHE_SIZE = 256;

type EmoteCollection = {
  cacheKey: string;
  emojiMap: ReadonlyMap<string, SanitisedEmote>;
  emoteMap: ReadonlyMap<string, SanitisedEmote>;
};

let nextEmoteArrayId = 0;

function getEmoteArrayId(emotes: SanitisedEmote[]): number {
  let id = emoteArrayIds.get(emotes);
  if (id === undefined) {
    nextEmoteArrayId += 1;
    id = nextEmoteArrayId;
    emoteArrayIds.set(emotes, id);
  }
  return id;
}

const createCacheKey = (
  inputString: string,
  baseCollectionKey: string,
  scopedEmoteKey: string,
): string => {
  return `${baseCollectionKey}:${scopedEmoteKey}:${inputString}`;
};

function getBaseCollectionKey(
  emojiEmotes: SanitisedEmote[],
  sevenTvGlobalEmotes: SanitisedEmote[],
  sevenTvChannelEmotes: SanitisedEmote[],
  twitchGlobalEmotes: SanitisedEmote[],
  twitchChannelEmotes: SanitisedEmote[],
  ffzChannelEmotes: SanitisedEmote[],
  ffzGlobalEmotes: SanitisedEmote[],
  bttvChannelEmotes: SanitisedEmote[],
  bttvGlobalEmotes: SanitisedEmote[],
): string {
  return [
    getEmoteArrayId(emojiEmotes),
    getEmoteArrayId(sevenTvGlobalEmotes),
    getEmoteArrayId(sevenTvChannelEmotes),
    getEmoteArrayId(twitchGlobalEmotes),
    getEmoteArrayId(twitchChannelEmotes),
    getEmoteArrayId(ffzChannelEmotes),
    getEmoteArrayId(ffzGlobalEmotes),
    getEmoteArrayId(bttvChannelEmotes),
    getEmoteArrayId(bttvGlobalEmotes),
  ].join('|');
}

function setIfMissing(
  emoteMap: Map<string, SanitisedEmote>,
  emotes: SanitisedEmote[],
): void {
  emotes.forEach(emote => {
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, emote);
    }
  });
}

function getBaseCollection({
  bttvChannelEmotes,
  bttvGlobalEmotes,
  emojiEmotes,
  ffzChannelEmotes,
  ffzGlobalEmotes,
  sevenTvChannelEmotes,
  sevenTvGlobalEmotes,
  twitchChannelEmotes,
  twitchGlobalEmotes,
}: Pick<
  Required<EmoteProcessorParams>,
  | 'bttvChannelEmotes'
  | 'bttvGlobalEmotes'
  | 'emojiEmotes'
  | 'ffzChannelEmotes'
  | 'ffzGlobalEmotes'
  | 'sevenTvChannelEmotes'
  | 'sevenTvGlobalEmotes'
  | 'twitchChannelEmotes'
  | 'twitchGlobalEmotes'
>): EmoteCollection {
  const cacheKey = getBaseCollectionKey(
    emojiEmotes,
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    twitchGlobalEmotes,
    twitchChannelEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  );
  const cached = baseCollectionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const emoteMap = new Map<string, SanitisedEmote>();
  const emojiMap = new Map<string, SanitisedEmote>();

  setIfMissing(emoteMap, sevenTvChannelEmotes);
  setIfMissing(emoteMap, twitchChannelEmotes);
  setIfMissing(emoteMap, ffzChannelEmotes);
  setIfMissing(emoteMap, bttvChannelEmotes);
  setIfMissing(emoteMap, emojiEmotes);
  setIfMissing(emoteMap, sevenTvGlobalEmotes);
  setIfMissing(emoteMap, twitchGlobalEmotes);
  setIfMissing(emoteMap, ffzGlobalEmotes);
  setIfMissing(emoteMap, bttvGlobalEmotes);

  emojiEmotes.forEach(emote => {
    if (emote.site !== 'Emoji') {
      return;
    }

    const emojiHexcode = emote.emoji_hexcode ?? emote.id;
    if (!emojiMap.has(emojiHexcode)) {
      emojiMap.set(emojiHexcode, emote);
    }
  });

  const collection = { cacheKey, emojiMap, emoteMap };
  if (baseCollectionCache.size >= MAX_BASE_COLLECTION_CACHE_SIZE) {
    const firstKey = baseCollectionCache.keys().next().value;
    if (firstKey) {
      baseCollectionCache.delete(firstKey);
      const evictedPrefix = `${firstKey}:`;
      scopedLookupCache.forEach((_, scopedKey) => {
        if (scopedKey.startsWith(evictedPrefix)) {
          scopedLookupCache.delete(scopedKey);
        }
      });
    }
  }
  baseCollectionCache.set(cacheKey, collection);
  return collection;
}

function getEmoteIdsKey(emotes: SanitisedEmote[]): string {
  if (emotes.length === 0) {
    return '0';
  }

  return emotes.map(emote => emote.id).join(',');
}

function getScopedEmoteKey(
  sevenTvPersonalEmotes: SanitisedEmote[],
  twitchSubscriberEmotes: SanitisedEmote[],
): string {
  return `${getEmoteIdsKey(sevenTvPersonalEmotes)}|${getEmoteIdsKey(
    twitchSubscriberEmotes,
  )}`;
}

function createScopedEmoteLookup(
  baseCollection: EmoteCollection,
  sevenTvPersonalEmotes: SanitisedEmote[],
  twitchSubscriberEmotes: SanitisedEmote[],
  scopedEmoteKey: string,
): (name: string) => SanitisedEmote | undefined {
  if (
    sevenTvPersonalEmotes.length === 0 &&
    twitchSubscriberEmotes.length === 0
  ) {
    return name => baseCollection.emoteMap.get(name);
  }

  const cacheKey = `${baseCollection.cacheKey}:${scopedEmoteKey}`;
  const cached = scopedLookupCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const personalEmoteMap = new Map<string, SanitisedEmote>();
  const subscriberEmoteMap = new Map<string, SanitisedEmote>();
  setIfMissing(personalEmoteMap, sevenTvPersonalEmotes);
  setIfMissing(subscriberEmoteMap, twitchSubscriberEmotes);

  const lookup = (name: string) =>
    personalEmoteMap.get(name) ??
    subscriberEmoteMap.get(name) ??
    baseCollection.emoteMap.get(name);

  if (scopedLookupCache.size >= MAX_SCOPED_LOOKUP_CACHE_SIZE) {
    const firstKey = scopedLookupCache.keys().next().value;
    if (firstKey) {
      scopedLookupCache.delete(firstKey);
    }
  }
  scopedLookupCache.set(cacheKey, lookup);

  return lookup;
}

// Emoji hexcode keys always include a code point above 0x7F, so pure-ASCII
// words (the vast majority of chat words) can never match the emoji map -
// skip the per-word code-point expansion for them.
function hasNonAsciiChar(word: string): boolean {
  for (let i = 0; i < word.length; i += 1) {
    if (word.charCodeAt(i) > 0x7f) {
      return true;
    }
  }
  return false;
}

const BACKWARD_EMOTE_MODIFIERS = new Set(['w!', 'h!', 'v!']);

function isWhitespacePart(part: ParsedPart): boolean {
  return part.type === 'text' && /^\s+$/.test(part.content);
}

function applyEmoteCompositionPass(parts: ParsedPart[]): ParsedPart[] {
  const out: ParsedPart[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (part.type === 'emote' && part.zero_width) {
      let anchor = out.length - 1;
      while (anchor >= 0 && isWhitespacePart(out[anchor] as ParsedPart)) {
        anchor -= 1;
      }
      const base = anchor >= 0 ? out[anchor] : undefined;
      if (base?.type === 'emote' && !base.zero_width) {
        out.length = anchor + 1;
        // Skip duplicate overlay ids (double decode + darkened alpha).
        const overlaid = base.overlaid ?? [];
        const alreadyStacked =
          base.id === part.id ||
          overlaid.some(overlay => overlay.id === part.id);
        if (!alreadyStacked) {
          base.overlaid = [...overlaid, part];
        }
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    const content =
      part.type === 'emote' || part.type === 'text' ? part.content.trim() : '';

    if (content && BACKWARD_EMOTE_MODIFIERS.has(content)) {
      let next = index + 1;
      while (
        next < parts.length &&
        isWhitespacePart(parts[next] as ParsedPart)
      ) {
        next += 1;
      }
      if (parts[next]?.type === 'emote') {
        index = next - 1;
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    if (content.startsWith('ffz') && content.length > 3) {
      let anchor = out.length - 1;
      while (anchor >= 0 && isWhitespacePart(out[anchor] as ParsedPart)) {
        anchor -= 1;
      }
      if (anchor >= 0 && out[anchor]?.type === 'emote') {
        out.length = anchor + 1;
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    out.push(part);
  }

  return out;
}

export const processEmotesWorklet = (
  params: EmoteProcessorParams,
): ParsedPart[] => {
  const {
    inputString,
    emojiEmotes = [],
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvPersonalEmotes = [],
    twitchGlobalEmotes,
    twitchChannelEmotes,
    twitchSubscriberEmotes = [],
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  } = params;

  const cleanInput = stripInvisibleChars(inputString);

  if (!cleanInput) {
    return [{ type: 'text', content: cleanInput }];
  }

  const baseCollection = getBaseCollection({
    bttvChannelEmotes,
    bttvGlobalEmotes,
    emojiEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvGlobalEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
  });
  const scopedEmoteKey = getScopedEmoteKey(
    sevenTvPersonalEmotes,
    twitchSubscriberEmotes,
  );
  const cacheKey = createCacheKey(
    cleanInput,
    baseCollection.cacheKey,
    scopedEmoteKey,
  );

  const cached = cache.get(cacheKey);
  if (cached) {
    return applyMentionLoginCasing(cached);
  }
  const getEmote = createScopedEmoteLookup(
    baseCollection,
    sevenTvPersonalEmotes,
    twitchSubscriberEmotes,
    scopedEmoteKey,
  );
  const emojiMap = baseCollection.emojiMap;

  const words = cleanInput.split(/(\s+)/);
  const result: ParsedPart[] = [];

  let i = 0;
  while (i < words.length) {
    const word = words[i];

    if (!word) {
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (/^\s+$/.test(word)) {
      result.push({ type: 'text', content: word });
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (word.startsWith('@')) {
      const mentionText = word.endsWith(' ') ? word.trimEnd() : word;
      result.push({
        type: 'mention',
        content: mentionText,
      });
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    const linkParts = parseWordLinkParts(word);
    if (linkParts) {
      result.push(...linkParts);
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    let emote = getEmote(word);

    if (!emote && word.length <= 8 && hasNonAsciiChar(word)) {
      const upperWord = [...word]
        .map(char => char.codePointAt(0)?.toString(16).toUpperCase() || '')
        .join('-');
      emote = emojiMap.get(upperWord);
    }

    if (emote) {
      result.push({
        id: emote.id,
        name: emote.name,
        type: 'emote',
        content: word,
        creator: emote.creator || '',
        emote_link: emote.emote_link || '',
        original_name:
          emote.site === 'Emoji' && !word.startsWith(':')
            ? word
            : emote.original_name || '',
        site: emote.site || '',
        static_url: emote.static_url,
        thumbnail: emote.url,
        url: emote.url,
        width: emote.width,
        height: emote.height,
        aspect_ratio: emote.aspect_ratio,
        zero_width: emote.zero_width,
      });
    } else {
      result.push({ type: 'text', content: word });
    }
    i += 1;
  }

  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }

  const resolvedResult = applyMentionLoginCasing(
    applyEmoteCompositionPass(result),
  );
  queueMentionLoginsFromParts(resolvedResult);

  cache.set(cacheKey, resolvedResult);

  return resolvedResult;
};
