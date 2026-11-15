import type { TwitchSanitisedEmote } from '@app/types/emote';
import { parseTwitchEmotesTag } from '@app/utils/chat/extract-emotes/parseTwitchEmotesTag';
import { evictOldestWhenFull } from '@app/utils/collection/evictOldestWhenFull';
import { twitchEmoteCdn } from '@app/utils/emote/cdn/twitch';

const SURROGATE_PAIR_REGEX = /[\uD800-\uDFFF]/;

const extractEmotes = (
  emotes: Record<string, string[]> | undefined,
  message: string,
): TwitchSanitisedEmote[] => {
  if (!emotes) {
    return [];
  }

  // The emotes tag indexes by code point; only pay the full code-point
  // expansion when surrogate pairs are present.
  const graphemes = SURROGATE_PAIR_REGEX.test(message) ? [...message] : null;

  const imageVariantsByEmoteId = new Map<
    string,
    TwitchSanitisedEmote['image_variants']
  >();

  return Object.entries(emotes).flatMap(([emoteId, positions]) =>
    positions.map(position => {
      const [startText, endText] = position.split('-');
      const start = Number(startText);
      const end = Number(endText);

      const name = graphemes
        ? graphemes.slice(start, end + 1).join('')
        : message.slice(start, end + 1);

      let imageVariants = imageVariantsByEmoteId.get(emoteId);

      if (!imageVariants) {
        imageVariants = twitchEmoteCdn.buildVariants({
          id: emoteId,
          animated: null,
        });

        imageVariantsByEmoteId.set(emoteId, imageVariants);
      }

      const url = imageVariants.animated?.['4x'] ?? '';

      return {
        id: emoteId,
        name,
        original_name: name,
        creator: 'Unknown',
        emote_link: url,
        url,
        static_url: imageVariants.static?.['4x'],
        image_variants: imageVariants,
        site: 'Twitch Subscriber',
        provider: 'twitch',
      };
    }),
  );
};

const NO_EMOTES: TwitchSanitisedEmote[] = [];

const resultCache = new Map<string, TwitchSanitisedEmote[]>();

const MAX_RESULT_CACHE_SIZE = 256;

export const extractEmotesFromTag = (
  emotesTag: string | undefined,
  message: string,
): TwitchSanitisedEmote[] => {
  if (!emotesTag) {
    return NO_EMOTES;
  }

  const cacheKey = `${emotesTag}\u0000${message}`;
  const cached = resultCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const result = extractEmotes(parseTwitchEmotesTag(emotesTag), message);

  evictOldestWhenFull(resultCache, MAX_RESULT_CACHE_SIZE);

  resultCache.set(cacheKey, result);
  return result;
};
