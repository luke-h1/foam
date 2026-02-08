import 'react-native-reanimated';

import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { ParsedPart } from './replaceTextWithEmotes';

interface EmoteProcessorParams {
  inputString: string;
  userstate: UserStateTags | null;
  sevenTvGlobalEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  sevenTvPersonalEmotes?: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
  twitchChannelEmotes: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
}

const cache = new Map<string, ParsedPart[]>();
const MAX_CACHE_SIZE = 1000;

// Helper to create cache key from emote sets and input string
const createCacheKey = (
  inputString: string,
  sevenTvGlobalEmotes: SanitisedEmote[],
  sevenTvChannelEmotes: SanitisedEmote[],
  sevenTvPersonalEmotes: SanitisedEmote[],
  twitchGlobalEmotes: SanitisedEmote[],
  twitchChannelEmotes: SanitisedEmote[],
  ffzChannelEmotes: SanitisedEmote[],
  ffzGlobalEmotes: SanitisedEmote[],
  bttvChannelEmotes: SanitisedEmote[],
  bttvGlobalEmotes: SanitisedEmote[],
): string => {
  'worklet';

  const emoteHash = [
    sevenTvGlobalEmotes.length,
    sevenTvChannelEmotes.length,
    sevenTvPersonalEmotes.length,
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
    sevenTvPersonalEmotes[0]?.id || '',
    sevenTvPersonalEmotes[sevenTvPersonalEmotes.length - 1]?.id || '',
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
    sevenTvPersonalEmotes = [],
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
    sevenTvPersonalEmotes,
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
  const emoteMap = new Map<string, SanitisedEmote>();

  // Personal emotes have highest priority (only the sender can use them)
  const personalEmotes = [...sevenTvPersonalEmotes];

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

  // Add personal emotes first (highest priority)
  personalEmotes.forEach(emote => {
    emoteMap.set(emote.name, emote);
  });

  // Add channel emotes, only if not already set by personal emotes
  channelEmotes.forEach(emote => {
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, emote);
    }
  });

  // Add global emotes, only if not already set by personal or channel emotes
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

    let emote = emoteMap.get(word);

    // Fallback: case-insensitive lookup if exact match fails
    if (!emote) {
      const lowerWord = word.toLowerCase();
      const entries = Array.from(emoteMap.entries());
      for (let j = 0; j < entries.length; j += 1) {
        const entry = entries[j];
        if (entry) {
          const [emoteName, emoteData] = entry;
          if (emoteName.toLowerCase() === lowerWord) {
            emote = emoteData;
            break;
          }
        }
      }
    }

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
