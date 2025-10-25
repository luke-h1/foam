import 'react-native-reanimated';

import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { ChatUserstate } from 'tmi.js';
import { ParsedPart } from './replaceTextWithEmotes';

interface EmoteProcessorParams {
  inputString: string;
  userstate: ChatUserstate | null;
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];
  twitchChannelEmotes: SanitisiedEmoteSet[];
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];
  bttvChannelEmotes: SanitisiedEmoteSet[];
  bttvGlobalEmotes: SanitisiedEmoteSet[];
}

// Worklet for processing emotes in a separate thread
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

  // Create emote map for fast lookup
  const emoteMap = new Map<string, SanitisiedEmoteSet>();

  // Channel emotes take priority
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

  // Add channel emotes first
  channelEmotes.forEach(emote => {
    emoteMap.set(emote.name, emote);
  });

  // Add global emotes only if not already set by channel emotes
  globalEmotes.forEach(emote => {
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, emote);
    }
  });

  // Simple text processing - split by spaces and check for emotes
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

    // Check if word is an emote
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

  return result;
};
