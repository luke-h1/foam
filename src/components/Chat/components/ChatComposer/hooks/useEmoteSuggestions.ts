import { useCurrentEmoteData, useEmojis } from '@app/store/chatStore/hooks';
import type { SanitisedEmote } from '@app/types/emote';

interface SearchableEmote {
  emote: SanitisedEmote;
  isChannel: boolean;
  lowerName: string;
  lowerOriginalName?: string;
}

interface UseEmoteSuggestionsProps {
  searchTerm: string;
  maxSuggestions?: number;
  prioritizeChannelEmotes?: boolean;
}

function buildSearchableEmotes(
  emoteSources: {
    sevenTvChannelEmotes: (SanitisedEmote | undefined)[];
    sevenTvGlobalEmotes: (SanitisedEmote | undefined)[];
    twitchChannelEmotes: (SanitisedEmote | undefined)[];
    twitchGlobalEmotes: (SanitisedEmote | undefined)[];
    bttvChannelEmotes: (SanitisedEmote | undefined)[];
    bttvGlobalEmotes: (SanitisedEmote | undefined)[];
    ffzChannelEmotes: (SanitisedEmote | undefined)[];
    ffzGlobalEmotes: (SanitisedEmote | undefined)[];
    emojis: (SanitisedEmote | undefined)[];
  },
  prioritizeChannelEmotes: boolean,
): SearchableEmote[] {
  const emoteMap = new Map<string, SearchableEmote>();

  const addEmotes = (
    emotes: (SanitisedEmote | undefined)[],
    isChannel: boolean,
  ) => {
    for (const emote of emotes) {
      if (!emote?.name) {
        continue;
      }

      const dedupeKey =
        emote.site === 'Emoji'
          ? `emoji:${emote.emoji_hexcode ?? emote.id}`
          : emote.name.toLowerCase();

      if (emoteMap.has(dedupeKey)) {
        continue;
      }

      const lowerName = emote.name.toLowerCase();
      emoteMap.set(dedupeKey, {
        emote,
        isChannel,
        lowerName,
        lowerOriginalName: emote.original_name?.toLowerCase(),
      });
    }
  };

  addEmotes(emoteSources.sevenTvGlobalEmotes, false);
  addEmotes(emoteSources.twitchGlobalEmotes, false);
  addEmotes(emoteSources.bttvGlobalEmotes, false);
  addEmotes(emoteSources.ffzGlobalEmotes, false);
  addEmotes(emoteSources.emojis, false);

  addEmotes(emoteSources.sevenTvChannelEmotes, true);
  addEmotes(emoteSources.twitchChannelEmotes, true);
  addEmotes(emoteSources.bttvChannelEmotes, true);
  addEmotes(emoteSources.ffzChannelEmotes, true);

  const uniqueEmotes = Array.from(emoteMap.values());
  uniqueEmotes.sort((a, b) => {
    if (prioritizeChannelEmotes && a.isChannel !== b.isChannel) {
      return a.isChannel ? -1 : 1;
    }

    return a.emote.name.localeCompare(b.emote.name);
  });

  return uniqueEmotes;
}

export function useEmoteSuggestions({
  searchTerm,
  maxSuggestions = 50,
  prioritizeChannelEmotes = true,
}: UseEmoteSuggestionsProps) {
  const {
    bttvChannelEmotes,
    bttvGlobalEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvGlobalEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
  } = useCurrentEmoteData();
  const emojis = useEmojis();

  const searchableEmotes = buildSearchableEmotes(
    {
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      emojis,
    },
    prioritizeChannelEmotes,
  );

  const allEmotes = searchableEmotes.map(entry => entry.emote);

  const trimmedSearch = searchTerm.trim();
  const lowerSearch = trimmedSearch.toLowerCase();
  const filteredEmotes =
    trimmedSearch.length < 1
      ? []
      : searchableEmotes
          .filter(
            entry =>
              entry.lowerName.includes(lowerSearch) ||
              entry.lowerOriginalName?.includes(lowerSearch),
          )
          .slice(0, maxSuggestions)
          .map(entry => entry.emote);

  return {
    filteredEmotes,
    allEmotes,
  };
}
