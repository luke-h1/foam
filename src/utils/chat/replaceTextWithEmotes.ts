import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { findEmotesInText } from '@app/utils/chat/findEmotesInText';
import { getSortedEmoteNames } from '@app/utils/chat/findEmotesInText/getSortedEmoteNames';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { parseWordLinkParts } from '@app/utils/chat/replaceTextWithEmotes/parseWordLinkParts';
import { sanitizeInput } from '@app/utils/chat/sanitizeInput';
import { splitTextWithTwemoji } from '@app/utils/chat/splitTextWithTwemoji';
import { stripInvisibleChars } from '@app/utils/chat/stripInvisibleChars';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants/withResolvedEmoteImageVariants';
import { logger } from '@app/utils/logger';

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

function findEmoteMatchingMention(
  mentionText: string,
  mentionEmoteMap: ReadonlyMap<string, SanitisedEmote>,
): SanitisedEmote | undefined {
  if (!mentionText.startsWith('@')) {
    return undefined;
  }

  const mentionTarget = mentionText.slice(1).trimEnd().toLowerCase();
  if (!mentionTarget) {
    return undefined;
  }

  return mentionEmoteMap.get(mentionTarget);
}

/**
 * Strip trailing delimiter punctuation so `Kappa!` / `Pog,` can hit the
 * direct Map path instead of the dense findEmotesInText scan.
 */
const TRAILING_EMOTE_PUNCTUATION = /[.,!?)}:;'"\\|/]+$/;

function splitTrailingEmotePunctuation(word: string): {
  core: string;
  trailing: string;
} {
  const match = TRAILING_EMOTE_PUNCTUATION.exec(word);
  if (!match || match.index === 0) {
    return { core: word, trailing: '' };
  }

  return {
    core: word.slice(0, match.index),
    trailing: match[0],
  };
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
  const mentionEmoteMap = new Map<string, SanitisedEmote>();

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

  const registerMentionAliases = (emote: SanitisedEmote) => {
    const lowerName = emote.name.trimEnd().toLowerCase();
    if (lowerName && !mentionEmoteMap.has(lowerName)) {
      mentionEmoteMap.set(lowerName, emote);
    }

    const alternateName = emote.original_name?.trim();
    if (alternateName) {
      const lowerAlternate = alternateName.toLowerCase();
      if (!mentionEmoteMap.has(lowerAlternate)) {
        mentionEmoteMap.set(lowerAlternate, emote);
      }
    }
  };

  const registerEmoteLookup = (emote: SanitisedEmote) => {
    const resolved = withResolvedEmoteImageVariants(emote);
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, resolved);
      registerMentionAliases(resolved);
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
      registerMentionAliases(resolvedEmote);
    }

    if (resolvedEmote.site === 'Emoji') {
      const emojiHexcode = resolvedEmote.emoji_hexcode ?? resolvedEmote.id;
      if (!emojiMap.has(emojiHexcode)) {
        emojiMap.set(emojiHexcode, resolvedEmote);
      }
    }
  });

  const sanitizedInput = stripInvisibleChars(sanitizeInput(inputString));
  const sortedEmoteNames = getSortedEmoteNames(emoteMap);

  try {
    const splitParts = splitTextWithTwemoji(sanitizedInput);
    const replacedParts: ParsedPart[] = [];

    splitParts.forEach(({ emoji, text }) => {
      if (emoji) {
        const unifiedEmoji = decodeEmojiToUnified(emoji);
        // Standalone emoji are keyed without FE0F in the dataset (e.g. "2764"
        // for ❤️), while ZWJ sequences keep it — try both forms.
        const unifiedWithoutVariant = unifiedEmoji
          .split('-')
          .filter(hex => hex !== 'FE0F')
          .join('-');
        const foundEmote =
          emojiMap.get(unifiedEmoji) ??
          emojiMap.get(unifiedWithoutVariant) ??
          emoteMap.get(unifiedEmoji);

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
        // Strip U+FFFD (replacement character = invalid/malformed unicode from IRC)
        // and the whitespace immediately surrounding it before word-splitting.
        const textSegments = text.split(/\s*�+\s*/);
        for (const segment of textSegments) {
          if (!segment) continue;
          const words = segment.split(/(\s+)/);
          words.forEach(word => {
            if (word.startsWith('@')) {
              const fullMention = word.endsWith(' ') ? word.trimEnd() : word;

              let mentionText = fullMention;
              let mentionTrailing = '';
              let emoteInMention = findEmoteMatchingMention(
                fullMention,
                mentionEmoteMap,
              );

              if (!emoteInMention) {
                const loginMatch = fullMention.match(/^@[a-zA-Z0-9_]+/);
                if (loginMatch && loginMatch[0] !== fullMention) {
                  mentionText = loginMatch[0];
                  mentionTrailing = fullMention.slice(mentionText.length);
                  emoteInMention = findEmoteMatchingMention(
                    mentionText,
                    mentionEmoteMap,
                  );
                }
              }

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
              if (mentionTrailing) {
                replacedParts.push({
                  type: 'text',
                  content: mentionTrailing,
                });
              }
            } else if (/\s+/.test(word)) {
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
                  const { core, trailing } =
                    splitTrailingEmotePunctuation(word);
                  const punctuatedEmote =
                    trailing && core ? emoteMap.get(core) : undefined;

                  if (punctuatedEmote) {
                    replacedParts.push({
                      type: 'emote',
                      content: core,
                      ...punctuatedEmote,
                    });
                    replacedParts.push({
                      type: 'text',
                      content: trailing,
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
            }
          });
        }
      }
    });

    return replacedParts;
  } catch (error) {
    logger.chat.error('Error replacing words with emotes:', error);
    return [{ type: 'text', content: inputString }];
  }
}
