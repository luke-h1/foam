import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { logger } from '../logger';
import { sanitizeInput } from './sanitizeInput';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';

export type TwitchNotices =
  /**
   * Twitch notices
   */
  | 'viewermilestone'
  | 'sub'
  | 'resub'
  | 'subgift'
  | 'anongift'
  | 'submysterygift'
  | 'giftpaidupgrade'
  | 'rewardgift'
  | 'anongiftpaidupgrade'
  | 'raid'
  | 'unraid'
  | 'sharedchatnotice';

export type PartVariant =
  /**
   * Plain text
   */
  | 'text'
  /**
   * Emoji i.e. a normal unicode emoji 🚀
   */
  | 'emote'
  /**
   * Mention i.e. @username
   */
  | 'mention'
  /**
   * stv emote
   */
  | 'stvEmote'
  /**
   * Twitch clip
   */
  | 'twitchClip'
  /**
   * Notice event
   */
  | 'notice'
  /**
   * stv emote added to set
   */
  | 'stv_emote_added'
  /**
   * stv emote removed from set
   */
  | 'stv_emote_removed'
  | TwitchNotices;

export type TwitchAnd7TVVariant = Extract<
  PartVariant,
  'stvEmote' | 'twitchClip'
>;

export type ParsedPart<TType extends PartVariant = PartVariant> = TType extends
  | 'stv_emote_added'
  | 'stv_emote_removed'
  ? {
      type: TType;
      stvEvents: {
        type: 'added' | 'removed';
        data: SanitisedEmote;
      };
    }
  : TType extends 'sub'
    ? {
        type: TType;
        subscriptionEvent: {
          msgId: 'sub';
          displayName: string;
          message?: string;
          plan: string; // 1000, 2000, 3000 for Prime, Tier 1, Tier 2, Tier 3
          planName?: string; // Prime, Tier 1, Tier 2, Tier 3
          months?: number; // cumulative-months
          streakMonths?: number; // streak-months
          shouldShareStreak?: boolean; // should-share-streak
        };
      }
    : TType extends 'resub'
      ? {
          type: TType;
          subscriptionEvent: {
            msgId: 'resub';
            displayName: string;
            message?: string;
            plan: string; // 1000, 2000, 3000 for Prime, Tier 1, Tier 2, Tier 3
            planName?: string; // Prime, Tier 1, Tier 2, Tier 3
            months: number; // cumulative-months
            streakMonths?: number; // streak-months
            shouldShareStreak?: boolean; // should-share-streak
          };
        }
      : TType extends 'anongift'
        ? {
            type: TType;
            subscriptionEvent: {
              msgId: 'subgift';
              displayName: string;
              message?: string;
              plan: string; // 1000, 2000, 3000 for Prime, Tier 1, Tier 2, Tier 3
              planName?: string; // Prime, Tier 1, Tier 2, Tier 3
              recipientDisplayName: string; // recipient-display-name
              recipientId: string; // recipient-id
              giftMonths: number; // gift-months
              months: number; // months
            };
          }
        : TType extends 'anongiftpaidupgrade'
          ? {
              type: TType;
              subscriptionEvent: {
                msgId: 'anongiftpaidupgrade';
                displayName: string;
                message?: string;
                promoName: string; // promo-name
                promoGiftTotal: string; // promo-gift-total
              };
            }
          : TType extends 'viewermilestone'
            ? {
                type: TType;
                category: string;
                reward: string;
                value: string;
                content: string;
                systemMsg: string; //"LimeTitanTV\\swatched\\s20\\sconsecutive\\sstreams\\sand\\ssparked\\sa\\swatch\\sstreak!",
                login: string;
                displayName: string;
              }
            : /**
               * Normal message
               */
              Pick<
                Partial<SanitisedEmote>,
                'creator' | 'emote_link' | 'original_name' | 'site' | 'url'
              > & {
                id?: string;
                name?: string;
                flags?: number;
                type: TType;
                content: string;
                color?: string;
                width?: number;
                height?: number;
                aspect_ratio?: number;
                zero_width?: boolean;

                /**
                 * Used for emote and twitch clip previews
                 */
                thumbnail?: string;
              };

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
  emote: SanitisedEmote;
  start: number;
  end: number;
}

const DELIMITER_REGEX = /[\s,.!?()[\]{}<>:;'"\\]/;

export function findEmotesInText(
  text: string,
  emoteMap: Map<string, SanitisedEmote>,
): FindEmotesInTextReturn[] {
  const foundEmotes: {
    emote: SanitisedEmote;
    start: number;
    end: number;
  }[] = [];

  const sortedEmoteNames = Array.from(emoteMap.keys()).sort(
    (a, b) => b.length - a.length,
  );

  let currentIndex = 0;

  function isDelimiter(char: string): boolean {
    return DELIMITER_REGEX.test(char);
  }

  // Pre-scan text for URL-like ranges to avoid per-character regex
  const urlRanges: { start: number; end: number }[] = [];
  const urlPattern = /https?:\/\/[^\s]+/gi;
  let urlMatch: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((urlMatch = urlPattern.exec(text)) !== null) {
    urlRanges.push({
      start: urlMatch.index,
      end: urlMatch.index + urlMatch[0].length,
    });
  }

  function isWithinUrl(index: number): boolean {
    return urlRanges.some(range => index >= range.start && index < range.end);
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
     * For normal emotes and alphanumeric Twitch emotes, check word boundaries
     */
    const hasValidStart =
      index === 0 || (index > 0 && isDelimiter(text.charAt(index - 1)));
    const endIndex = index + emoteName.length;
    const hasValidEnd =
      endIndex === text.length || isDelimiter(text.charAt(endIndex));

    // For Twitch emotes, be more lenient with boundaries
    if (isTwitchEmote) {
      return hasValidStart || hasValidEnd;
    }

    return hasValidStart && hasValidEnd;
  }

  while (currentIndex < text.length) {
    let found = false;

    // eslint-disable-next-line no-restricted-syntax
    for (const emoteName of sortedEmoteNames) {
      const emote = emoteMap.get(emoteName);
      if (emote) {
        const isTwitchEmote =
          emote.site === 'Twitch Global' || emote.site === 'Twitch Channel';

        if (isTwitchEmote) {
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
 * emotes in replies
 * test that all emotes work
 * unit test
 * clean up
 */
export function replaceTextWithEmotes({
  inputString,
  sevenTvChannelEmotes,
  sevenTvGlobalEmotes,
  sevenTvPersonalEmotes = [],
  twitchGlobalEmotes,
  bttvChannelEmotes,
  bttvGlobalEmotes,
  ffzChannelEmotes,
  ffzGlobalEmotes,
  twitchChannelEmotes,
  userstate,
}: {
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
}): ParsedPart[] {
  if (!inputString) {
    return [{ type: 'text', content: inputString }];
  }

  const emoteMap = new Map<string, SanitisedEmote>();

  /**
   * Personal emotes have the highest priority (only the sender can use them)
   * Then channel emotes take priority over global emotes
   */
  const personalEmotes = [...sevenTvPersonalEmotes] as const;

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

  // add global emotes, only if not already set by personal or channel emotes
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
            url: foundEmote.url,
            aspect_ratio: foundEmote.aspect_ratio,
            zero_width: foundEmote.zero_width,
            width: foundEmote.width,
            height: foundEmote.height,
          });
        } else if (emoji && !emoji.includes('\uFFFD')) {
          /**
           * No emote found - only include if not a replacement character (encoding issue)
           * U+FFFD (�) indicates invalid/malformed unicode
           */
          replacedParts.push({
            type: 'text',
            content: emoji,
          });
          // Otherwise skip - don't render broken unicode
        }
      } else if (text) {
        // Split text into words and process each word
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
                site: emoteInMention.site,
                aspect_ratio: emoteInMention.aspect_ratio,
                zero_width: emoteInMention.zero_width,
                width: emoteInMention.width,
                height: emoteInMention.height,
              });
            }
            replacedParts.push({
              type: 'mention',
              content: mentionText,
              color: userstate?.color,
              ...emoteInMention,
            });
          } else if (/\s+/.test(word)) {
            // Preserve whitespace
            replacedParts.push({
              type: 'text',
              content: word,
            });
          } else {
            /**
             * Our custom link parser
             */
            const linkMetadata = parseLink(word);
            if (linkMetadata) {
              replacedParts.push({
                ...linkMetadata,
                // @ts-expect-error - ts struggling to narrow the type of our @see ParsedPart type
                content: word,
              });
            } else {
              // Fast path: direct Map lookup for standalone emote words
              const directEmote = emoteMap.get(word);

              if (directEmote) {
                replacedParts.push({
                  type: 'emote',
                  content: directEmote.name,
                  ...directEmote,
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
          }
        });
      }
    });

    // logger.chat.debug('Final replaced parts:', replacedParts);
    return replacedParts;
  } catch (error) {
    logger.chat.error('Error replacing words with emotes:', error);
    return [{ type: 'text', content: inputString }];
  }
}
