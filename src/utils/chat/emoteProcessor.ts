import 'react-native-reanimated';

import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ParsedPart } from './replaceTextWithEmotes';

interface EmoteProcessorParams {
  inputString: string;
  userstate: UserStateTags | null;
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];
  twitchChannelEmotes: SanitisiedEmoteSet[];
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];
  bttvChannelEmotes: SanitisiedEmoteSet[];
  bttvGlobalEmotes: SanitisiedEmoteSet[];
}

const cache = new Map<string, ParsedPart[]>();
const MAX_CACHE_SIZE = 1000;

// Helper to create cache key from emote sets and input string
const createCacheKey = (
  inputString: string,
  sevenTvGlobalEmotes: SanitisiedEmoteSet[],
  sevenTvChannelEmotes: SanitisiedEmoteSet[],
  twitchGlobalEmotes: SanitisiedEmoteSet[],
  twitchChannelEmotes: SanitisiedEmoteSet[],
  ffzChannelEmotes: SanitisiedEmoteSet[],
  ffzGlobalEmotes: SanitisiedEmoteSet[],
  bttvChannelEmotes: SanitisiedEmoteSet[],
  bttvGlobalEmotes: SanitisiedEmoteSet[],
): string => {
  'worklet';

  const emoteHash = [
    sevenTvGlobalEmotes.length,
    sevenTvChannelEmotes.length,
    twitchGlobalEmotes.length,
    twitchChannelEmotes.length,
    ffzChannelEmotes.length,
    ffzGlobalEmotes.length,
    bttvChannelEmotes.length,
    bttvGlobalEmotes.length,
  ].join('|');

  const firstLastIds = [
    sevenTvChannelEmotes[0]?.id || '',
    sevenTvChannelEmotes[sevenTvChannelEmotes.length - 1]?.id || '',
    sevenTvGlobalEmotes[0]?.id || '',
    sevenTvGlobalEmotes[sevenTvGlobalEmotes.length - 1]?.id || '',
  ].join('|');

  return `${emoteHash}:${firstLastIds}:${inputString}`;
};

export const processEmotesWorklet = (
  params: EmoteProcessorParams,
): ParsedPart[] => {
  'worklet';

  const {
    inputString,
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    twitchGlobalEmotes,
    twitchChannelEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  } = params;

  if (!inputString) {
    return [{ type: 'text', content: inputString }];
  }

  const cacheKey = createCacheKey(
    inputString,
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    twitchGlobalEmotes,
    twitchChannelEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  );

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const emoteMap = new Map<string, SanitisiedEmoteSet>();

  const channelEmotes = [
    ...sevenTvChannelEmotes,
    ...twitchChannelEmotes,
    ...ffzChannelEmotes,
    ...bttvChannelEmotes,
  ];

  const globalEmotes = [
    ...sevenTvGlobalEmotes,
    ...twitchGlobalEmotes,
    ...ffzGlobalEmotes,
    ...bttvGlobalEmotes,
  ];

  channelEmotes.forEach(emote => {
    emoteMap.set(emote.name, emote);
  });

  globalEmotes.forEach(emote => {
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, emote);
    }
  });

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

    // Skip whitespace
    if (/^\s+$/.test(word)) {
      result.push({ type: 'text', content: word });
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    const emote = emoteMap.get(word);
    if (emote) {
      result.push({
        id: emote.id,
        name: emote.name,
        type: 'emote',
        content: emote.name,
        creator: emote.creator || '',
        emote_link: emote.emote_link || '',
        original_name: emote.original_name || '',
        site: emote.site || '',
        thumbnail: emote.url,
        width: emote.width || 20,
        height: emote.height || 20,
        url: emote.url,
      });
    } else {
      result.push({ type: 'text', content: word });
    }
    i += 1;
  }

  const hasEmotes = result.some(
    part => part.type === 'emote' || part.type === 'stvEmote',
  );

  if (hasEmotes) {
    if (cache.size >= MAX_CACHE_SIZE) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        cache.delete(firstKey);
      }
    }

    cache.set(cacheKey, result);
  }

  return result;
};
