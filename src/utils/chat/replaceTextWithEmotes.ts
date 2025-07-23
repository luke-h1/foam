import { SanitisiedEmoteSet } from '@app/services';
import { ChatUserstate } from 'tmi.js';
import { logger } from '../logger';
import { sanitizeInput } from './sanitizeInput';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const partVariants = {
  text: 'text',
  emote: 'emote',
  mention: 'mention',
  stvEmote: 'stvEmote',
  twitchClip: 'twitchClip',
} as const;

type PartVariant = keyof typeof partVariants;

export type TwitchAnd7TVVariant = Extract<
  PartVariant,
  'stvEmote' | 'twitchClip'
>;

export interface ParsedPart<TType extends PartVariant = PartVariant>
  extends Pick<
    Partial<SanitisiedEmoteSet>,
    'creator' | 'emote_link' | 'original_name' | 'site' | 'url'
  > {
  id?: string;
  name?: string;
  flags?: number;
  type: TType;
  content: string;
  color?: string;
  width?: number;
  height?: number;

  /**
   * Used for emote and twitch clip previews
   */
  thumbnail?: string;
}

function decodeEmojiToUnified(emoji: string): string {
  return [...emoji]
    .map(char => {
      const codePoint = char.codePointAt(0);
      return codePoint !== undefined
        ? codePoint.toString(16).toUpperCase()
        : '';
    })
    .join('-');
}

export interface FindEmotesInTextReturn {
  emote: SanitisiedEmoteSet;
  start: number;
  end: number;
}

export function findEmotesInText(
  text: string,
  emoteMap: Map<string, SanitisiedEmoteSet>,
): FindEmotesInTextReturn[] {
  const foundEmotes: {
    emote: SanitisiedEmoteSet;
    start: number;
    end: number;
  }[] = [];

  /**
   * Sort emotes by length (longest first) to handle cases where
   * one emote name is a substring of another
   */
  const sortedEmoteNames = Array.from(emoteMap.keys()).sort(
    (a, b) => b.length - a.length,
  );

  let currentIndex = 0;

  function isDelimiter(char: string): boolean {
    // eslint-disable-next-line no-useless-escape
    return /[\s,.!?()[\]{}<>:;'"\\\/]/.test(char);
  }

  function isWithinUrl(index: number): boolean {
    const beforeText = text.slice(Math.max(0, index - 50), index);
    const afterText = text.slice(index, Math.min(text.length, index + 50));
    return (
      /https?:\/\//.test(beforeText) ||
      /^[^\s]+\.(com|net|org|io|co|uk|de|fr|it|es|nl|be|at|ch|dk|se|no|fi|pl|pt|br|ca|au|nz|jp|cn|in|ru|ua|tr|mx|ar|cl|pe|co|ve|ec|bo|py|uy|cr|pa|do|gt|sv|hn|ni|pr|cu|ht|jm|tt|bb|gd|lc|vc|ag|dm|kn|pm|vc|ai|vg|ky|bm|ms|tc|aw|cw|sx|bq|gf|gp|mq|re|yt|pm|wf|tf|nc|pf|tk|nu|ck|ws|to|tv|vu|fj|pg|sb|ki|fm|mh|nr|pw|as|gu|mp|pr|vi|um|us|edu|gov|mil|int|aero|biz|coop|info|museum|name|pro|travel|mobi|cat|jobs|tel|asia|post|tel|xxx|onion|bit|coin|bazar|emc|lib|wow|zil|neo|eth|btc|ltc|doge|xrp|ada|dot|sol|avax|matic|atom|link|uni|aave|comp|snx|mkr|yfi|sushi|crv|1inch|bal|ren|uma|band|rsr|perp|api|app|dev|test|local|localhost|internal|private|lan|home|corp|intranet|localdomain|test|example|invalid|localhost|local|internal|private|lan|home|corp|intranet|localdomain|test|example|invalid)$/i.test(
        afterText,
      )
    );
  }

  function isValidEmotePosition(
    index: number,
    emoteName: string,
    isTwitchEmote: boolean,
  ): boolean {
    // For URLs, never match emotes
    if (isWithinUrl(index)) {
      return false;
    }

    /**
     * For Twitch emotes that are pure special characters (like <3), need word boundaries
     */
    if (isTwitchEmote && /^[^a-zA-Z0-9]+$/.test(emoteName)) {
      const hasValidStart =
        index === 0 || (index > 0 && isDelimiter(text.charAt(index - 1)));

      const endIndex = index + emoteName.length;
      const hasValidEnd =
        endIndex === text.length || isDelimiter(text.charAt(endIndex));
      return hasValidStart && hasValidEnd;
    }

    /**
     * For normal emotes and alphanumeric Twitch emotes, be more lenient with boundaries
     */
    const hasValidStart =
      index === 0 || (index > 0 && isDelimiter(text.charAt(index - 1)));
    const endIndex = index + emoteName.length;
    const hasValidEnd =
      endIndex === text.length || isDelimiter(text.charAt(endIndex));

    /**
     * more lenient with word boundaries for all emotes
     */
    return hasValidStart || hasValidEnd;
  }

  while (currentIndex < text.length) {
    let found = false;

    // eslint-disable-next-line no-restricted-syntax
    for (const emoteName of sortedEmoteNames) {
      const emote = emoteMap.get(emoteName);
      if (emote) {
        const isTwitchEmote = emote.site === 'Twitch Global';

        if (isTwitchEmote) {
          /**
           * For Twitch emotes, we need an exact match
           */
          const exactMatch = text.slice(currentIndex).startsWith(emoteName);
          if (
            exactMatch &&
            isValidEmotePosition(currentIndex, emoteName, true)
          ) {
            foundEmotes.push({
              emote,
              start: currentIndex,
              end: currentIndex + emoteName.length,
            });
            currentIndex += emoteName.length;
            found = true;
            break;
          }
        } else {
          /**
           * Other emotes
           */
          const startIndex = text.indexOf(emoteName, currentIndex);
          if (
            startIndex !== -1 &&
            isValidEmotePosition(startIndex, emoteName, false)
          ) {
            foundEmotes.push({
              emote,
              start: startIndex,
              end: startIndex + emoteName.length,
            });
            currentIndex = startIndex + emoteName.length;
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      currentIndex += 1;
    }
  }

  return foundEmotes;
}

export const SEVENTV_EMOTE_LINK_REGEX =
  /https?:\/\/(?:www\.)?7tv\.app\/emotes\/([a-zA-Z0-9]+)/i;
export const TWITCH_CLIP_REGEX =
  /https?:\/\/(?:www\.)?clips\.twitch\.tv\/([a-zA-Z0-9-]+)/i;

export const TWITCH_CHANNEL_CLIP_REGEX =
  /https?:\/\/(?:www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/clip\/([a-zA-Z0-9-]+)/i;

function parseLink(url: string): ParsedPart | null {
  const sevenTvMatch = url.match(SEVENTV_EMOTE_LINK_REGEX);
  if (sevenTvMatch) {
    return {
      type: 'stvEmote',
      content: url,
      url,
    };
  }

  const twitchClipMatch = url.match(TWITCH_CLIP_REGEX);
  const twitchChannelClipMatch = url.match(TWITCH_CHANNEL_CLIP_REGEX);
  const clipId = twitchClipMatch?.[1] ?? twitchChannelClipMatch?.[1] ?? '';
  if (clipId) {
    return {
      type: 'twitchClip',
      content: url,
      url,
    };
  }

  return null;
}

/**
 * Problems to fix:
 * test that all emotes work
 * unit test
 * clean up
 */
export function replaceTextWithEmotes({
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

  const emoteMap = new Map<string, SanitisiedEmoteSet>();

  /**
   * Channel emotes always take priority over global emotes
   */
  const channelEmotes = [
    ...sevenTvChannelEmotes,
    ...twitchChannelEmotes,
    ...ffzChannelEmotes,
    ...bttvChannelEmotes,
  ] as const;

  const globalEmotes = [
    ...sevenTvGlobalEmotes,
    ...twitchGlobalEmotes,
    ...ffzGlobalEmotes,
    ...bttvGlobalEmotes,
  ] as const;

  channelEmotes.forEach(emote => {
    emoteMap.set(emote.name, {
      creator: emote.creator,
      emote_link: emote.emote_link,
      original_name: emote.original_name,
      site: emote.site,
      url: emote.url,
      height: emote.height,
      width: emote.width,
      id: emote.id,
      name: emote.name,
    });
  });

  // add global emotes, only if not already set by channel emotes
  globalEmotes.forEach(emote => {
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, emote);
    }
  });

  const sanitizedInput = sanitizeInput(inputString);

  try {
    const splitParts = splitTextWithTwemoji(sanitizedInput);
    const replacedParts: ParsedPart[] = [];

    splitParts.forEach(({ emoji, text }) => {
      if (emoji) {
        // Handle emojis
        const unifiedEmoji = decodeEmojiToUnified(emoji);
        const foundEmote = emoteMap.get(unifiedEmoji);

        if (foundEmote) {
          replacedParts.push({
            id: foundEmote.id,
            name: foundEmote.name,
            type: 'emote',
            content: foundEmote.name,
            creator: foundEmote.creator,
            emote_link: foundEmote.emote_link,
            original_name: foundEmote.original_name,
            site: foundEmote.site,
            thumbnail: foundEmote.url,
            width: foundEmote.width,
            height: foundEmote.height,
            url: foundEmote.url,
          });
        } else {
          /**
           * No emote found, just send the emoji as a text node
           */
          replacedParts.push({
            type: 'text',
            content: emoji,
          });
        }
      } else if (text) {
        /**
         * Split text into words and process each word
         */
        const words = text.split(/(\s+)/);
        words.forEach(word => {
          if (word.startsWith('@')) {
            const mentionText = word.endsWith(' ') ? word.trimEnd() : word;
            const emoteInMention = Array.from(emoteMap.values()).find(emote =>
              mentionText.includes(emote.name.trimEnd()),
            );

            if (emoteInMention) {
              replacedParts.push({
                type: 'emote',
                content: emoteInMention.name,
                creator: emoteInMention.creator,
                emote_link: emoteInMention.emote_link,
                original_name: emoteInMention.original_name,
                url: emoteInMention.url,
                thumbnail: emoteInMention.url,
                height: emoteInMention.height,
                width: emoteInMention.width,
                site: emoteInMention.site,
              });
            }

            replacedParts.push({
              type: 'mention',
              content: mentionText,
              color: userstate?.color,
              ...emoteInMention,
            });
          } else if (/\s+/.test(word)) {
            /**
             * Preserve whitespace
             */
            replacedParts.push({
              type: 'text',
              content: word,
            });
          } else {
            /**
             * Check for links and emotes in non-mention words
             */
            const linkMetadata = parseLink(word);
            if (linkMetadata) {
              replacedParts.push({
                ...linkMetadata,
                content: word,
              });
            } else {
              const foundEmotes = findEmotesInText(word, emoteMap);
              if (foundEmotes.length > 0) {
                let lastIndex = 0;
                foundEmotes.forEach(({ emote, start, end }) => {
                  if (start > lastIndex) {
                    replacedParts.push({
                      type: 'text',
                      content: word.slice(lastIndex, start),
                    });
                  }
                  replacedParts.push({
                    type: 'emote',
                    content: emote.name,
                    height: emote.height,
                    width: emote.width,
                    ...emote,
                  });
                  lastIndex = end;
                });
                if (lastIndex < word.length) {
                  replacedParts.push({
                    type: 'text',
                    content: word.slice(lastIndex),
                  });
                }
              } else {
                replacedParts.push({
                  type: 'text',
                  content: word,
                });
              }
            }
          }
        });
      }
    });

    logger.chat.debug('Final replaced parts:', replacedParts);
    return replacedParts;
  } catch (error) {
    logger.chat.error('Error replacing words with emotes:', error);
    return [{ type: 'text', content: inputString }];
  }
}
