import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { findEmotesInText } from '@app/utils/chat/findEmotesInText';
import { getEmoteMatchIndex } from '@app/utils/chat/findEmotesInText/getEmoteMatchIndex';
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

/**
 * Lets `Kappa!` / `Pog,` hit the Map path instead of findEmotesInText.
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

type EmoteLookupCollection = {
  emoteMap: Map<string, SanitisedEmote>;
  emojiMap: Map<string, SanitisedEmote>;
};

type EmoteProviderLists = {
  emojiEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  sevenTvPersonalEmotes: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
  twitchChannelEmotes: SanitisedEmote[];
  twitchSubscriberEmotes: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
};

const EMPTY_EMOTES: SanitisedEmote[] = [];
const emoteArrayIds = new WeakMap<SanitisedEmote[], number>();
const lookupCollectionCache = new Map<string, EmoteLookupCollection>();
const MAX_LOOKUP_COLLECTION_CACHE_SIZE = 4;
let nextEmoteArrayId = 0;

function getEmoteArrayId(emotes: SanitisedEmote[]): number {
  let id = emoteArrayIds.get(emotes);
  if (id === undefined) {
    nextEmoteArrayId += 1;
    id = nextEmoteArrayId;
    emoteArrayIds.set(emotes, id);
  }
  return id;
}

function getLookupCollectionKey(lists: EmoteProviderLists): string {
  return [
    getEmoteArrayId(lists.emojiEmotes),
    getEmoteArrayId(lists.sevenTvGlobalEmotes),
    getEmoteArrayId(lists.sevenTvChannelEmotes),
    getEmoteArrayId(lists.sevenTvPersonalEmotes),
    getEmoteArrayId(lists.twitchGlobalEmotes),
    getEmoteArrayId(lists.twitchChannelEmotes),
    getEmoteArrayId(lists.twitchSubscriberEmotes),
    getEmoteArrayId(lists.ffzChannelEmotes),
    getEmoteArrayId(lists.ffzGlobalEmotes),
    getEmoteArrayId(lists.bttvChannelEmotes),
    getEmoteArrayId(lists.bttvGlobalEmotes),
  ].join('|');
}

function buildLookupCollection(
  lists: EmoteProviderLists,
): EmoteLookupCollection {
  const emoteMap = new Map<string, SanitisedEmote>();
  const emojiMap = new Map<string, SanitisedEmote>();

  const registerScopedEmote = (emote: SanitisedEmote) => {
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

  const registerGlobalEmote = (emote: SanitisedEmote) => {
    const resolved = withResolvedEmoteImageVariants(emote);
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, resolved);
    }

    if (resolved.site === 'Emoji') {
      const emojiHexcode = resolved.emoji_hexcode ?? resolved.id;
      if (!emojiMap.has(emojiHexcode)) {
        emojiMap.set(emojiHexcode, resolved);
      }
    }
  };

  // Personal / subscriber / channel first, then globals.
  lists.sevenTvPersonalEmotes.forEach(registerScopedEmote);
  lists.twitchSubscriberEmotes.forEach(registerScopedEmote);
  lists.sevenTvChannelEmotes.forEach(registerScopedEmote);
  lists.twitchChannelEmotes.forEach(registerScopedEmote);
  lists.ffzChannelEmotes.forEach(registerScopedEmote);
  lists.bttvChannelEmotes.forEach(registerScopedEmote);
  lists.emojiEmotes.forEach(registerGlobalEmote);
  lists.sevenTvGlobalEmotes.forEach(registerGlobalEmote);
  lists.twitchGlobalEmotes.forEach(registerGlobalEmote);
  lists.ffzGlobalEmotes.forEach(registerGlobalEmote);
  lists.bttvGlobalEmotes.forEach(registerGlobalEmote);

  return { emoteMap, emojiMap };
}

function getLookupCollection(lists: EmoteProviderLists): EmoteLookupCollection {
  const cacheKey = getLookupCollectionKey(lists);
  const cached = lookupCollectionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const collection = buildLookupCollection(lists);
  if (lookupCollectionCache.size >= MAX_LOOKUP_COLLECTION_CACHE_SIZE) {
    const oldestKey = lookupCollectionCache.keys().next().value;
    if (oldestKey) {
      lookupCollectionCache.delete(oldestKey);
    }
  }
  lookupCollectionCache.set(cacheKey, collection);
  return collection;
}

export function replaceTextWithEmotes({
  inputString,
  emojiEmotes = EMPTY_EMOTES,
  sevenTvChannelEmotes,
  sevenTvGlobalEmotes,
  sevenTvPersonalEmotes = EMPTY_EMOTES,
  twitchGlobalEmotes,
  twitchSubscriberEmotes = EMPTY_EMOTES,
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

  const { emoteMap, emojiMap } = getLookupCollection({
    emojiEmotes,
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvPersonalEmotes,
    twitchGlobalEmotes,
    twitchChannelEmotes,
    twitchSubscriberEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  });

  const sanitizedInput = stripInvisibleChars(sanitizeInput(inputString));
  const matchIndex = getEmoteMatchIndex(emoteMap);

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
          replacedParts.push({
            type: 'text',
            content: emoji,
          });
        }
      } else if (text) {
        // Strip U+FFFD and surrounding whitespace before word-splitting.
        const textSegments = text.split(/\s*�+\s*/);
        for (const segment of textSegments) {
          if (!segment) continue;
          const words = segment.split(/(\s+)/);
          words.forEach(word => {
            if (word.startsWith('@')) {
              const fullMention = word.endsWith(' ') ? word.trimEnd() : word;

              let mentionText = fullMention;
              let mentionTrailing = '';
              const loginMatch = fullMention.match(/^@[a-zA-Z0-9_]+/);
              if (loginMatch && loginMatch[0] !== fullMention) {
                mentionText = loginMatch[0];
                mentionTrailing = fullMention.slice(mentionText.length);
              }

              replacedParts.push({
                type: 'mention',
                content: mentionText,
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
                return;
              }

              const directEmote = emoteMap.get(word);
              if (directEmote) {
                replacedParts.push({
                  type: 'emote',
                  content: word,
                  ...directEmote,
                });
                return;
              }

              const { core, trailing } = splitTrailingEmotePunctuation(word);
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
                return;
              }

              const foundEmotes = findEmotesInText(word, emoteMap, matchIndex);
              if (foundEmotes.length === 0) {
                replacedParts.push({
                  type: 'text',
                  content: word,
                });
                return;
              }

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
