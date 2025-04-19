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
  // stv
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  sevenTvChannelEmotes: SanitisiedEmoteSet[];

  // twitch
  twitchGlobalEmotes: SanitisiedEmoteSet[];
  twitchChannelEmotes: SanitisiedEmoteSet[];

  // ffz
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];

  // bttv
  bttvChannelEmotes: SanitisiedEmoteSet[];
  bttvGlobalEmotes: SanitisiedEmoteSet[];
}): ParsedPart[] {
  const emojiData = [...sevenTvChannelEmotes, ...twitchGlobalEmotes].map(
    emote => ({
      ...emote,
      creator: emote.creator ?? undefined,
      bits: emote.bits !== undefined ? emote.bits.toString() : undefined,
    }),
  );

  // eslint-disable-next-line no-param-reassign
  inputString = sanitizeInput(inputString); // Sanitize input
  const ttvEmoteData = [...twitchChannelEmotes, ...twitchChannelEmotes];

  const nonGlobalEmoteData = [
    ...twitchChannelEmotes,
    ...sevenTvChannelEmotes,
    ...ffzChannelEmotes,
  ];

  try {
    const EmoteSplit = splitTextWithTwemoji(inputString); // Split text into parts (text and emojis)
    const replacedParts: ParsedPart[] = [];

    for (let i = 0; i < EmoteSplit.length; i += 1) {
      const part = EmoteSplit[i];
      let foundEmote: Emote | undefined;
      let emoteType = '';
      console.log('PART IS ->', part);

      // Check for custom emotes
      if (userstate?.custom_emotes) {
        foundEmote = userstate.custom_emotes.find(
          (emote: { name: { text: string } | undefined }) =>
            emote.name === part,
        );
        if (foundEmote) {
          emoteType = 'Custom emote';
        }
      }

      if (part && !foundEmote) {
        console.log('found emoji...');
        // console.log('unified part ->', part.emoji);
        foundEmote = emojiData.find(emoji => emoji.name === part.text);
        if (foundEmote) {
          emoteType = 'Emoji';
          foundEmote.url = part.text || foundEmote.url; // Use the Twemoji image URL if available
          replacedParts.push({
            type: 'emote',
            content: foundEmote.name,
            url: foundEmote.url,
          });
        }
      }

      // Check for Twitch emotes
      if (!foundEmote) {
        foundEmote = ttvEmoteData.find(
          emote => emote.name === sanitizeInput(part?.text ?? ''),
        );
        if (foundEmote) {
          emoteType = 'Twitch Emote';
        }
      }

      // Check for global emotes
      if (!foundEmote) {
        foundEmote = nonGlobalEmoteData.find(
          emote => emote.name === sanitizeInput(part?.text),
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
        if (part?.text.startsWith('@')) {
          console.log('mention');
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
