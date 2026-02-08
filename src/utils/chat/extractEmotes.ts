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
        site: 'Twitch Emote',
      };
    }),
  );
};
