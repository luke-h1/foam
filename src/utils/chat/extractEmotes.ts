import type { TwitchSanitisedEmote } from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';

function toTwitchTaggedEmoteUrl(
  emoteId: string,
  format: 'default' | 'static',
  scale: '2.0' | '3.0',
): string {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/${format}/dark/${scale}`;
}

const extractEmotes = (
  emotes: Record<string, string[]> | undefined,
  message: string,
): TwitchSanitisedEmote[] => {
  if (!emotes) {
    return [];
  }

  const graphemes = [...message];
  const imageVariantsByEmoteId = new Map<
    string,
    TwitchSanitisedEmote['image_variants']
  >();

  return Object.entries(emotes).flatMap(([emoteId, positions]) =>
    positions.map(position => {
      const [start, end] = position.split('-').map(Number);

      const name = graphemes.slice(start, (end as number) + 1).join('');
      let imageVariants = imageVariantsByEmoteId.get(emoteId);
      if (!imageVariants) {
        imageVariants = createEmoteImageVariants({
          animated: {
            '2x': toTwitchTaggedEmoteUrl(emoteId, 'default', '2.0'),
            '4x': toTwitchTaggedEmoteUrl(emoteId, 'default', '3.0'),
          },
          static: {
            '2x': toTwitchTaggedEmoteUrl(emoteId, 'static', '2.0'),
            '4x': toTwitchTaggedEmoteUrl(emoteId, 'static', '3.0'),
          },
        });
        imageVariantsByEmoteId.set(emoteId, imageVariants);
      }

      return {
        id: emoteId,
        name,
        original_name: name,
        creator: 'Unknown',
        emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
        url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
        static_url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/static/dark/3.0`,
        image_variants: imageVariants,
        site: 'Twitch Subscriber',
      };
    }),
  );
};

export const parseTwitchEmotesTag = (
  emotesTag: string | undefined,
): Record<string, string[]> | undefined => {
  if (!emotesTag?.trim()) {
    return undefined;
  }

  const entries = emotesTag.split('/').flatMap(entry => {
    const trimmed = entry.trim();
    return trimmed ? [trimmed] : [];
  });

  if (entries.length === 0) {
    return undefined;
  }

  return entries.reduce<Record<string, string[]>>((resolved, entry) => {
    const [emoteId, positionsRaw] = entry.split(':');
    if (!emoteId || !positionsRaw) {
      return resolved;
    }

    const positions = positionsRaw.split(',').flatMap(position => {
      const trimmed = position.trim();
      return trimmed ? [trimmed] : [];
    });

    if (positions.length > 0) {
      resolved[emoteId] = positions;
    }

    return resolved;
  }, {});
};

export const extractEmotesFromTag = (
  emotesTag: string | undefined,
  message: string,
): TwitchSanitisedEmote[] =>
  extractEmotes(parseTwitchEmotesTag(emotesTag), message);
