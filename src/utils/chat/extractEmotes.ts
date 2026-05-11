import type { TwitchSanitisedEmote } from '@app/types/emote';

export const extractEmotes = (
  emotes: Record<string, string[]> | undefined,
  message: string,
): TwitchSanitisedEmote[] => {
  if (!emotes) return [];
  const graphemes = [...message];
  return Object.entries(emotes).flatMap(([emoteId, positions]) =>
    positions.map(position => {
      const [start, end] = position.split('-').map(Number);

      const name = graphemes.slice(start, (end as number) + 1).join('');
      return {
        id: emoteId,
        name,
        original_name: name,
        creator: 'Unknown',
        emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
        url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
        static_url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/static/dark/3.0`,
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

  const entries = emotesTag
    .split('/')
    .map(entry => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return undefined;
  }

  return entries.reduce<Record<string, string[]>>((resolved, entry) => {
    const [emoteId, positionsRaw] = entry.split(':');
    if (!emoteId || !positionsRaw) {
      return resolved;
    }

    const positions = positionsRaw
      .split(',')
      .map(position => position.trim())
      .filter(Boolean);

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
