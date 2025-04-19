import { ChatUserstate } from 'tmi.js';
import { sanitizeInput } from './sanitizeInput';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';
import { useChatStore } from '@app/store/chatStore';
import { SanitisiedEmoteSet } from '@app/services';

interface Emote {
  name: string;
  url: string;
  site: string;
  creator?: string;
  color?: string;
  bits?: string;
}

interface ParsedPart {
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

export function replaceWithEmotesV2(
  inputString: string,
  userstate: ChatUserstate | null,
  sevenTvChannelEmotes: SanitisiedEmoteSet[],
  twitchGlobalEmotes: SanitisiedEmoteSet[],
): ParsedPart[] {
  if (!inputString) {
    return [{ type: 'text', content: inputString }];
  }

  const emojiData = [...sevenTvChannelEmotes, ...twitchGlobalEmotes];

  // eslint-disable-next-line no-param-reassign
  inputString = sanitizeInput(inputString); // Sanitize input

  try {
    const ttvEmoteData = [...twitchGlobalEmotes];
    const nonGlobalEmoteData = [...sevenTvChannelEmotes];
    const emoteData = [...ttvEmoteData, ...nonGlobalEmoteData];

    if (emoteData.length === 0) {
      return [{ type: 'text', content: inputString }];
    }

    const EmoteSplit = splitTextWithTwemoji(inputString); // Split text into parts (text and emojis)
    const replacedParts: ParsedPart[] = [];

    for (let i = 0; i < EmoteSplit.length; i += 1) {
      let part = EmoteSplit[i];
      let foundEmote: Emote | undefined;
      let emoteType = '';

      // Check for custom emotes
      if (userstate?.custom_emotes) {
        foundEmote = userstate.custom_emotes.find(emote => emote.name === part);
        if (foundEmote) {
          emoteType = 'Custom emote';
        }
      }

      // Check for emojis
      if (!foundEmote && part.emoji && emojiData.length > 0) {
        const unifiedPart = decodeEmojiToUnified(part.emoji); // Convert emoji to unified code
        foundEmote = emojiData.find(emoji => emoji.unified === unifiedPart);
        if (foundEmote) {
          emoteType = 'Emoji';
          foundEmote.url = part.image; // Use the Twemoji image URL
        }
      }

      // Check for Twitch emotes
      if (!foundEmote) {
        foundEmote = ttvEmoteData.find(
          emote => emote.name === sanitizeInput(part),
        );
        if (foundEmote) {
          emoteType = 'Twitch Emote';
        }
      }

      // Check for global emotes
      if (!foundEmote) {
        foundEmote = nonGlobalEmoteData.find(
          emote => emote.name === sanitizeInput(part),
        );
        if (foundEmote) {
          emoteType = 'Global Emote';
        }
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
        // eslint-disable-next-line no-lonely-if
        if (part.startsWith('@')) {
          replacedParts.push({
            type: 'mention',
            content: part,
            color: userstate?.title ? '#FF4500' : undefined,
          });
        } else {
          replacedParts.push({
            type: 'text',
            content: part,
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
