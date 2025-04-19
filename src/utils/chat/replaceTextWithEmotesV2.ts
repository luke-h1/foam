import { SanitisiedEmoteSet } from '@app/services';
import { ChatUserstate } from 'tmi.js';
import { sanitizeInput } from './sanitizeInput';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';

export interface ParsedPart {
  type: 'text' | 'emote' | 'mention';
  content: string;
  url?: string;
  color?: string;
  width?: number;
  height?: number;
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

function calculateAspectRatio(
  width: number,
  height: number,
  desiredHeight: number,
) {
  const aspectRatio = width / height;
  const calculatedWidth = desiredHeight * aspectRatio;
  return { width: calculatedWidth, height: desiredHeight };
}

async function getImageSize(
  urlOrDimensions: { width: number; height: number } | string,
  desiredHeight: number,
  retries = 3,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (
      typeof urlOrDimensions === 'object' &&
      urlOrDimensions.width &&
      urlOrDimensions.height
    ) {
      // If dimensions are provided directly, calculate aspect ratio
      const { width, height } = urlOrDimensions;
      const dimensions = calculateAspectRatio(width, height, desiredHeight);
      resolve(dimensions);
    } else if (typeof urlOrDimensions === 'string') {
      // Use the Image object to load the image and get its dimensions
      const loadImage = (attempt: number) => {
        const img = new Image();

        img.onload = () => {
          const dimensions = calculateAspectRatio(
            img.naturalWidth,
            img.naturalHeight,
            desiredHeight,
          );
          resolve(dimensions);
        };

        img.onerror = () => {
          console.error(
            `Error loading image: ${urlOrDimensions} (Attempt: ${
              attempt + 1
            }/${retries})`,
          );
          if (attempt < retries - 1) {
            console.warn(`Retrying image load (${attempt + 1}/${retries})...`);
            loadImage(attempt + 1);
          } else {
            reject(
              new Error(
                `Failed to load the image after ${retries} attempts: ${urlOrDimensions}`,
              ),
            );
          }
        };

        img.src = urlOrDimensions;
      };

      loadImage(0);
    } else {
      reject(
        new Error(
          'Invalid input. Expected an object with width and height or a URL string.',
        ),
      );
    }
  });
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
  const emoteMap = new Map<string, SanitisiedEmoteSet>();
  allEmotes.forEach(emote => {
    emoteMap.set(emote.name, {
      ...emote,
      creator: emote.creator,
      bits: emote.bits,
    });
  });

  // Sanitize input
  // eslint-disable-next-line no-param-reassign
  inputString = sanitizeInput(inputString);

  try {
    const splitEmote = splitTextWithTwemoji(inputString); // Split text into parts (text and emojis)

    console.log(splitEmote);
    const replacedParts: ParsedPart[] = [];

    for (let i = 0; i < splitEmote.length; i += 1) {
      const part = splitEmote[i];
      let foundEmote: SanitisiedEmoteSet | undefined;

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
        // eslint-disable-next-line no-lonely-if
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
