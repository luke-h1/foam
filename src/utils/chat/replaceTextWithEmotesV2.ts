import { SanitisiedEmoteSet } from '@app/services';
import { ChatUserstate } from 'tmi.js';
import { sanitizeInput } from './sanitizeInput';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';

interface Emote {
  name: string;
  url: string;
  site: string;
  creator?: string;
  color?: string;
  bits?: string;
}

export interface ParsedPart {
  type: 'text' | 'emote' | 'mention';
  content: string;
  url?: string;
  color?: string;
}

function decodeEmojiToUnified(emoji: string) {
  return [...emoji]
    .map(char => {
      const codePoint = char.codePointAt(0);
      return codePoint !== undefined
        ? codePoint.toString(16).toUpperCase()
        : '';
    })
    .join('-');
}
export function replaceWithEmotesV2({
  inputString,
  sevenTvChannelEmotes,
  sevenTvGlobalEmotes,
  twitchGlobalEmotes,
  bttvChannelEmotes,
  bttvGlobalEmotes,
  ffzChannelEmotes,
  ffzGlobalEmotes,
  twitchChannelEmotes,
  userstate,
}: {
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
}): ParsedPart[] {
  if (!inputString) {
    return [{ type: 'text', content: inputString }];
  }

  // Combine all emotes into one array
  const allEmotes = [
    ...sevenTvChannelEmotes,
    ...sevenTvGlobalEmotes,
    ...twitchGlobalEmotes,
    ...twitchChannelEmotes,
    ...ffzChannelEmotes,
    ...ffzGlobalEmotes,
    ...bttvChannelEmotes,
    ...bttvGlobalEmotes,
  ];

  // Create a lookup map for emotes by name
  const emoteMap = new Map<string, Emote>();
  allEmotes.forEach(emote => {
    emoteMap.set(emote.name, {
      ...emote,
      creator: emote.creator ?? undefined,
      bits: emote.bits !== undefined ? emote.bits.toString() : undefined,
    });
  });

  // Sanitize input
  inputString = sanitizeInput(inputString);

  try {
    const EmoteSplit = splitTextWithTwemoji(inputString); // Split text into parts (text and emojis)
    const replacedParts: ParsedPart[] = [];

    for (let i = 0; i < EmoteSplit.length; i += 1) {
      const part = EmoteSplit[i];
      let foundEmote: Emote | undefined;

      // Check for custom emotes
      if (userstate?.custom_emotes) {
        foundEmote = userstate.custom_emotes.find(
          (emote: { name: string }) => emote.name === part?.text,
        );
      }

      // Check for emojis
      if (!foundEmote && part?.emoji) {
        const unifiedEmoji = decodeEmojiToUnified(part.emoji); // Convert emoji to unified code
        foundEmote = allEmotes.find(emote => emote.name === unifiedEmoji);
      }

      // Check for emotes in the lookup map
      if (!foundEmote && part?.text) {
        foundEmote = emoteMap.get(part.text);
      }

      // If an emote is found, add it to the result
      if (foundEmote) {
        replacedParts.push({
          type: 'emote',
          content: foundEmote.name,
          url: foundEmote.url,
        });
      } else {
        // If no emote is found, treat it as plain text or a mention
        if (part?.text?.startsWith('@')) {
          replacedParts.push({
            type: 'mention',
            content: part.text,
            color: userstate?.color,
          });
        } else {
          replacedParts.push({
            type: 'text',
            content: part?.text ?? '',
          });
        }
      }
    }

    return replacedParts;
  } catch (error) {
    console.error('Error replacing words with emotes:', error);
    return [{ type: 'text', content: inputString }];
  }
}
