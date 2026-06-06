import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { applyMentionLoginCasing } from './resolveMentionLogin';
import { queueMentionLoginsFromParts } from './mentionLoginResolver';
import {
  findEmoteMatchingMention,
  parseWordLinkParts,
  ParsedPart,
} from './replaceTextWithEmotes';

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
const MAX_BASE_COLLECTION_CACHE_SIZE = 64;
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
  includeOriginalNameAlias = false,
): void {
  emotes.forEach(emote => {
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, emote);
    }
    if (!includeOriginalNameAlias) {
      return;
    }
    const alternateName = emote.original_name?.trim();
    if (
      alternateName &&
      alternateName !== emote.name &&
      !emoteMap.has(alternateName)
    ) {
      emoteMap.set(alternateName, emote);
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

  setIfMissing(emoteMap, sevenTvChannelEmotes, true);
  setIfMissing(emoteMap, twitchChannelEmotes, true);
  setIfMissing(emoteMap, ffzChannelEmotes, true);
  setIfMissing(emoteMap, bttvChannelEmotes, true);
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
  setIfMissing(personalEmoteMap, sevenTvPersonalEmotes, true);
  setIfMissing(subscriberEmoteMap, twitchSubscriberEmotes, true);

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

  if (!inputString) {
    return [{ type: 'text', content: inputString }];
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
    inputString,
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

  const words = inputString.split(/(\s+)/);
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
      const emoteInMention = findEmoteMatchingMention(
        mentionText,
        baseCollection.emoteMap.values(),
      );

      if (emoteInMention) {
        result.push({
          id: emoteInMention.id,
          name: emoteInMention.name,
          type: 'emote',
          content: emoteInMention.name,
          creator: emoteInMention.creator || '',
          emote_link: emoteInMention.emote_link || '',
          original_name: emoteInMention.original_name || '',
          site: emoteInMention.site || '',
          static_url: emoteInMention.static_url,
          thumbnail: emoteInMention.url,
          url: emoteInMention.url,
          width: emoteInMention.width,
          height: emoteInMention.height,
          aspect_ratio: emoteInMention.aspect_ratio,
          zero_width: emoteInMention.zero_width,
        });
      }

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

    if (!emote && word.length <= 8) {
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
        content: emote.site === 'Emoji' && !word.startsWith(':') ? word : word,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cache.delete(firstKey);
    }
  }

  const resolvedResult = applyMentionLoginCasing(result);
  queueMentionLoginsFromParts(resolvedResult);

  cache.set(cacheKey, resolvedResult);

  return resolvedResult;
};
