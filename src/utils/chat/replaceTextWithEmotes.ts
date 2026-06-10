import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { logger } from '../logger';
import {
  findEmotesInText,
  getSortedEmoteNames,
  type FindEmotesInTextReturn,
} from './findEmotesInText';
import { sanitizeInput } from './sanitizeInput';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';

export type { FindEmotesInTextReturn };

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
  | 'primepaidupgrade'
  | 'charitydonation'
  | 'ritual'
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
   * Generic http(s) URL
   */
  | 'link'
  /**
   * Notice event
   */
  | 'notice'
  | 'stv_emote_added'
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
            msgId: 'resub' | 'extendsub' | 'standardpayforward';
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
              msgId:
                | 'subgift'
                | 'anonsubgift'
                | 'communitypayforward'
                | 'primecommunitygiftreceived';
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
        : TType extends 'submysterygift'
          ? {
              type: TType;
              subscriptionEvent: {
                msgId: 'submysterygift' | 'anonsubmysterygift';
                displayName: string;
                message?: string;
                plan?: string;
                planName?: string;
                massGiftCount?: number;
                senderCount?: number;
              };
            }
          : TType extends 'giftpaidupgrade'
            ? {
                type: TType;
                subscriptionEvent: {
                  msgId: 'giftpaidupgrade';
                  displayName: string;
                  message?: string;
                  senderLogin?: string;
                  senderName?: string;
                  promoName?: string;
                  promoGiftTotal?: string;
                };
              }
            : TType extends 'anongiftpaidupgrade'
              ? {
                  type: TType;
                  subscriptionEvent: {
                    msgId: 'anongiftpaidupgrade';
                    displayName: string;
                    message?: string;
                    promoName: string;
                    promoGiftTotal: string;
                  };
                }
              : TType extends 'primepaidupgrade'
                ? {
                    type: TType;
                    subscriptionEvent: {
                      msgId: 'primepaidupgrade';
                      displayName: string;
                      message?: string;
                      plan: string;
                      planName?: string;
                      months?: number;
                    };
                  }
                : TType extends 'charitydonation'
                  ? {
                      type: TType;
                      displayName: string;
                      charityName: string;
                      amount: string;
                      currency: string;
                      systemMsg: string;
                      message?: string;
                    }
                  : TType extends 'ritual'
                    ? {
                        type: TType;
                        displayName: string;
                        ritualName: string;
                        systemMsg: string;
                        message?: string;
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
                          | 'creator'
                          | 'emote_link'
                          | 'image_variants'
                          | 'original_name'
                          | 'site'
                          | 'static_url'
                          | 'url'
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

export const SEVENTV_EMOTE_LINK_REGEX =
  /https?:\/\/(?:www\.)?7tv\.app\/emotes\/([a-zA-Z0-9]+)/i;
const TWITCH_CLIP_REGEX =
  /https?:\/\/(?:www\.)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/i;

const TWITCH_CHANNEL_CLIP_REGEX =
  /https?:\/\/(?:www\.)?twitch\.tv\/(?:[a-zA-Z0-9_]+\/)?clip\/([a-zA-Z0-9_-]+)/i;

export function getTwitchClipIdFromUrl(url: string): string | null {
  const twitchClipMatch = url.match(TWITCH_CLIP_REGEX);
  const twitchChannelClipMatch = url.match(TWITCH_CHANNEL_CLIP_REGEX);

  return twitchClipMatch?.[1] ?? twitchChannelClipMatch?.[1] ?? null;
}

const GENERIC_HTTP_URL_REGEX = /^https?:\/\//i;
const TRAILING_URL_PUNCTUATION = new Set('.,!?;:\'"\\)]}>'.split(''));

function splitTrailingUrlPunctuation(word: string): {
  urlCandidate: string;
  trailing: string;
} {
  let end = word.length;

  while (end > 0 && TRAILING_URL_PUNCTUATION.has(word[end - 1] ?? '')) {
    end -= 1;
  }

  return {
    urlCandidate: word.slice(0, end),
    trailing: word.slice(end),
  };
}

export function parseWordLinkParts(word: string): ParsedPart[] | null {
  if (!word || /\s+/.test(word)) {
    return null;
  }

  const { urlCandidate, trailing } = splitTrailingUrlPunctuation(word);

  if (!GENERIC_HTTP_URL_REGEX.test(urlCandidate)) {
    return null;
  }

  const trailingTextPart: ParsedPart[] = trailing
    ? [{ type: 'text', content: trailing }]
    : [];

  const sevenTvMatch = urlCandidate.match(SEVENTV_EMOTE_LINK_REGEX);
  if (sevenTvMatch) {
    return [
      {
        type: 'stvEmote',
        content: urlCandidate,
        url: urlCandidate,
      },
      ...trailingTextPart,
    ];
  }

  const clipId = getTwitchClipIdFromUrl(urlCandidate);
  if (clipId) {
    return [
      {
        type: 'twitchClip',
        content: urlCandidate,
        url: urlCandidate,
      },
      ...trailingTextPart,
    ];
  }

  return [
    {
      type: 'link',
      content: urlCandidate,
      url: urlCandidate,
    },
    ...trailingTextPart,
  ];
}

export function findEmoteMatchingMention(
  mentionText: string,
  emotes: Iterable<SanitisedEmote>,
): SanitisedEmote | undefined {
  if (!mentionText.startsWith('@')) {
    return undefined;
  }

  const mentionTarget = mentionText.slice(1).trimEnd().toLowerCase();
  if (!mentionTarget) {
    return undefined;
  }

  for (const emote of emotes) {
    const emoteName = emote.name.trimEnd();
    if (emoteName.toLowerCase() === mentionTarget) {
      return emote;
    }

    const alternateName = emote.original_name?.trim();
    if (alternateName && alternateName.toLowerCase() === mentionTarget) {
      return emote;
    }
  }

  return undefined;
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
  emojiEmotes = [],
  sevenTvChannelEmotes,
  sevenTvGlobalEmotes,
  sevenTvPersonalEmotes = [],
  twitchGlobalEmotes,
  twitchSubscriberEmotes = [],
  bttvChannelEmotes,
  bttvGlobalEmotes,
  ffzChannelEmotes,
  ffzGlobalEmotes,
  twitchChannelEmotes,
  userstate: _userstate,
}: {
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
}): ParsedPart[] {
  if (!inputString) {
    return [{ type: 'text', content: inputString }];
  }

  const emoteMap = new Map<string, SanitisedEmote>();
  const emojiMap = new Map<string, SanitisedEmote>();

  const channelEmotes = [
    ...sevenTvChannelEmotes,
    ...twitchChannelEmotes,
    ...ffzChannelEmotes,
    ...bttvChannelEmotes,
  ] as const;

  const globalEmotes = [
    ...emojiEmotes,
    ...sevenTvGlobalEmotes,
    ...twitchGlobalEmotes,
    ...ffzGlobalEmotes,
    ...bttvGlobalEmotes,
  ] as const;

  const registerEmoteLookup = (emote: SanitisedEmote) => {
    const resolved = withResolvedEmoteImageVariants(emote);
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, resolved);
    }
    const alternateName = emote.original_name?.trim();
    if (
      alternateName &&
      alternateName !== emote.name &&
      !emoteMap.has(alternateName)
    ) {
      emoteMap.set(alternateName, resolved);
    }
  };

  // Add sender-scoped emotes first (highest priority).
  sevenTvPersonalEmotes.forEach(registerEmoteLookup);

  twitchSubscriberEmotes.forEach(registerEmoteLookup);

  // Add channel emotes, only if not already set by personal emotes
  channelEmotes.forEach(registerEmoteLookup);

  // add global emotes, only if not already set by personal or channel emotes
  globalEmotes.forEach(emote => {
    const resolvedEmote = withResolvedEmoteImageVariants(emote);
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, resolvedEmote);
    }

    if (resolvedEmote.site === 'Emoji') {
      const emojiHexcode = resolvedEmote.emoji_hexcode ?? resolvedEmote.id;
      if (!emojiMap.has(emojiHexcode)) {
        emojiMap.set(emojiHexcode, resolvedEmote);
      }
    }
  });

  const sanitizedInput = sanitizeInput(inputString);
  const sortedEmoteNames = getSortedEmoteNames(emoteMap);

  try {
    const splitParts = splitTextWithTwemoji(sanitizedInput);
    const replacedParts: ParsedPart[] = [];

    splitParts.forEach(({ emoji, text }) => {
      if (emoji) {
        const unifiedEmoji = decodeEmojiToUnified(emoji);
        const foundEmote =
          emojiMap.get(unifiedEmoji) ?? emoteMap.get(unifiedEmoji);

        if (foundEmote) {
          replacedParts.push({
            id: foundEmote.id,
            name: foundEmote.name,
            type: 'emote',
            content: foundEmote.site === 'Emoji' ? emoji : foundEmote.name,
            creator: foundEmote.creator,
            emote_link: foundEmote.emote_link,
            image_variants: foundEmote.image_variants,
            original_name:
              foundEmote.site === 'Emoji' ? emoji : foundEmote.original_name,
            site: foundEmote.site,
            static_url: foundEmote.static_url,
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
            const emoteInMention = findEmoteMatchingMention(
              mentionText,
              emoteMap.values(),
            );

            if (emoteInMention) {
              replacedParts.push({
                type: 'emote',
                content: emoteInMention.name,
                creator: emoteInMention.creator,
                emote_link: emoteInMention.emote_link,
                image_variants: emoteInMention.image_variants,
                original_name: emoteInMention.original_name,
                static_url: emoteInMention.static_url,
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
              ...emoteInMention,
            });
          } else if (/\s+/.test(word)) {
            // Preserve whitespace
            replacedParts.push({
              type: 'text',
              content: word,
            });
          } else {
            const linkParts = parseWordLinkParts(word);
            if (linkParts) {
              replacedParts.push(...linkParts);
            } else {
              // Fast path: direct Map lookup for standalone emote words
              const directEmote = emoteMap.get(word);

              if (directEmote) {
                replacedParts.push({
                  type: 'emote',
                  content: word,
                  ...directEmote,
                });
              } else {
                const foundEmotes = findEmotesInText(
                  word,
                  emoteMap,
                  sortedEmoteNames,
                );
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
                      content: word.slice(start, end),
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
