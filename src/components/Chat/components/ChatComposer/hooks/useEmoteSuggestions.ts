import { useCurrentEmoteData, useEmojis } from '@app/store/chatStore/hooks';
import type { SanitisedEmote } from '@app/types/emote';
import { useMemo } from 'react';

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

  const searchableEmotes = useMemo(() => {
    const emoteMap = new Map<string, SearchableEmote>();

    const addEmotes = (
      emotes: Array<SanitisedEmote | undefined>,
      isChannel: boolean,
    ) => {
      for (const emote of emotes) {
        if (!emote?.name) {
          continue;
        }

        const dedupeKey =
          emote.site === 'Emoji'
            ? `emoji:${emote.id}`
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

    addEmotes(sevenTvGlobalEmotes, false);
    addEmotes(twitchGlobalEmotes, false);
    addEmotes(bttvGlobalEmotes, false);
    addEmotes(ffzGlobalEmotes, false);
    addEmotes(emojis, false);

    // Channel emotes override global emotes with the same name.
    addEmotes(sevenTvChannelEmotes, true);
    addEmotes(twitchChannelEmotes, true);
    addEmotes(bttvChannelEmotes, true);
    addEmotes(ffzChannelEmotes, true);

    const uniqueEmotes = Array.from(emoteMap.values());
    uniqueEmotes.sort((a, b) => {
      if (prioritizeChannelEmotes && a.isChannel !== b.isChannel) {
        return a.isChannel ? -1 : 1;
      }

      return a.emote.name.localeCompare(b.emote.name);
    });

    return uniqueEmotes;
  }, [
    sevenTvChannelEmotes,
    sevenTvGlobalEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    emojis,
    prioritizeChannelEmotes,
  ]);

  const allEmotes = useMemo(
    () => searchableEmotes.map(entry => entry.emote),
    [searchableEmotes],
  );

  const filteredEmotes = useMemo(() => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      return [];
    }

    const lowerSearch = trimmedSearch.toLowerCase();

    if (lowerSearch.length < 1) {
      return [];
    }

    const results: SanitisedEmote[] = [];

    for (const entry of searchableEmotes) {
      if (results.length >= maxSuggestions) {
        break;
      }

      if (
        entry.lowerName.includes(lowerSearch) ||
        entry.lowerOriginalName?.includes(lowerSearch)
      ) {
        results.push(entry.emote);
      }
    }

    return results;
  }, [maxSuggestions, searchTerm, searchableEmotes]);

  return {
    filteredEmotes,
    allEmotes,
  };
}
