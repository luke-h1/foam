import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import {
  createWorkletRuntime,
  runOnRuntimeAsync,
  runOnRuntimeSync,
  type WorkletRuntime,
} from 'react-native-worklets';
import { ParsedPart } from './replaceTextWithEmotes';

export interface EmoteProcessorParams {
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

type EmoteCollection = {
  cacheKey: string;
  emojiMap: ReadonlyMap<string, SanitisedEmote>;
  emoteMap: ReadonlyMap<string, SanitisedEmote>;
};

let nextEmoteArrayId = 0;
let chatParsingRuntime: WorkletRuntime | null | undefined;

function getChatParsingRuntime(): WorkletRuntime | null {
  if (chatParsingRuntime !== undefined) {
    return chatParsingRuntime;
  }

  try {
    chatParsingRuntime = createWorkletRuntime({ name: 'chat-parsing' });
  } catch {
    chatParsingRuntime = null;
  }

  return chatParsingRuntime;
}

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
  sevenTvPersonalEmotes: SanitisedEmote[],
  twitchSubscriberEmotes: SanitisedEmote[],
): string => {
  const scopedEmoteHash = [
    sevenTvPersonalEmotes.length,
    twitchSubscriberEmotes.length,
  ].join('|');

  const firstLastIds = [
    sevenTvPersonalEmotes[0]?.id || '',
    sevenTvPersonalEmotes[sevenTvPersonalEmotes.length - 1]?.id || '',
    twitchSubscriberEmotes[0]?.id || '',
    twitchSubscriberEmotes[twitchSubscriberEmotes.length - 1]?.id || '',
  ].join('|');

  return `${baseCollectionKey}:${scopedEmoteHash}:${firstLastIds}:${inputString}`;
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
    }
  }
  baseCollectionCache.set(cacheKey, collection);
  return collection;
}

function createScopedEmoteLookup(
  baseEmoteMap: ReadonlyMap<string, SanitisedEmote>,
  sevenTvPersonalEmotes: SanitisedEmote[],
  twitchSubscriberEmotes: SanitisedEmote[],
): (name: string) => SanitisedEmote | undefined {
  if (
    sevenTvPersonalEmotes.length === 0 &&
    twitchSubscriberEmotes.length === 0
  ) {
    return name => baseEmoteMap.get(name);
  }

  const personalEmoteMap = new Map<string, SanitisedEmote>();
  const subscriberEmoteMap = new Map<string, SanitisedEmote>();
  sevenTvPersonalEmotes.forEach(emote => {
    personalEmoteMap.set(emote.name, emote);
  });
  twitchSubscriberEmotes.forEach(emote => {
    subscriberEmoteMap.set(emote.name, emote);
  });

  return name =>
    personalEmoteMap.get(name) ??
    subscriberEmoteMap.get(name) ??
    baseEmoteMap.get(name);
}

export const processEmotesWorklet = (
  params: EmoteProcessorParams,
): ParsedPart[] => {
  'worklet';

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
  const cacheKey = createCacheKey(
    inputString,
    baseCollection.cacheKey,
    sevenTvPersonalEmotes,
    twitchSubscriberEmotes,
  );

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const getEmote = createScopedEmoteLookup(
    baseCollection.emoteMap,
    sevenTvPersonalEmotes,
    twitchSubscriberEmotes,
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
        content:
          emote.site === 'Emoji' && !word.startsWith(':') ? word : emote.name,
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

  cache.set(cacheKey, result);

  return result;
};

export function processEmotesOnChatRuntime(
  params: EmoteProcessorParams,
): Promise<ParsedPart[]> {
  const runtime = getChatParsingRuntime();
  if (!runtime || typeof runOnRuntimeAsync !== 'function') {
    return Promise.resolve(processEmotesWorklet(params));
  }

  return runOnRuntimeAsync(
    runtime,
    (workletParams: EmoteProcessorParams) => {
      'worklet';
      return processEmotesWorklet(workletParams);
    },
    params,
  ).catch(() => processEmotesWorklet(params));
}

export function processEmotesOnChatRuntimeSync(
  params: EmoteProcessorParams,
): ParsedPart[] {
  const runtime = getChatParsingRuntime();
  if (!runtime || typeof runOnRuntimeSync !== 'function') {
    return processEmotesWorklet(params);
  }

  try {
    return runOnRuntimeSync(
      runtime,
      (workletParams: EmoteProcessorParams) => {
        'worklet';
        return processEmotesWorklet(workletParams);
      },
      params,
    );
  } catch {
    return processEmotesWorklet(params);
  }
}
