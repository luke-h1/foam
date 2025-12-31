import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { useCurrentEmoteData, useEmojis } from '@app/store/chatStore';
import { useMemo } from 'react';

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

  const allEmotes = useMemo(() => {
    const channelEmotes = [
      ...sevenTvChannelEmotes,
      ...twitchChannelEmotes,
      ...bttvChannelEmotes,
      ...ffzChannelEmotes,
    ];

    const globalEmotes = [
      ...sevenTvGlobalEmotes,
      ...twitchGlobalEmotes,
      ...bttvGlobalEmotes,
      ...ffzGlobalEmotes,
      ...emojis,
    ];

    const emoteMap = new Map<string, SanitisiedEmoteSet>();

    globalEmotes.forEach(emote => {
      if (emote && emote.name) {
        emoteMap.set(emote.name.toLowerCase(), emote);
      }
    });

    // Add channel emotes (override global ones with same name)
    channelEmotes.forEach(emote => {
      if (emote && emote.name) {
        emoteMap.set(emote.name.toLowerCase(), emote);
      }
    });

    const uniqueEmotes = Array.from(emoteMap.values());

    if (prioritizeChannelEmotes) {
      const channelEmoteIds = new Set(channelEmotes.map(ce => ce.id));

      return uniqueEmotes.sort((a, b) => {
        const aIsChannel = channelEmoteIds.has(a.id);
        const bIsChannel = channelEmoteIds.has(b.id);

        if (aIsChannel && !bIsChannel) return -1;
        if (!aIsChannel && bIsChannel) return 1;

        return a.name.localeCompare(b.name);
      });
    }

    return uniqueEmotes.sort((a, b) => a.name.localeCompare(b.name));
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

  const filteredEmotes = useMemo(() => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      return [];
    }

    const lowerSearch = trimmedSearch.toLowerCase();

    if (lowerSearch.length < 1) {
      return [];
    }

    const results: SanitisiedEmoteSet[] = [];
    const maxResults = maxSuggestions;

    // eslint-disable-next-line no-restricted-syntax
    for (const emote of allEmotes) {
      if (results.length >= maxResults) break;

      const nameMatch = emote.name.toLowerCase().includes(lowerSearch);
      const originalNameMatch = emote.original_name
        ?.toLowerCase()
        .includes(lowerSearch);

      if (nameMatch || originalNameMatch) {
        results.push(emote);
      }
    }

    return results;
  }, [allEmotes, searchTerm, maxSuggestions]);

  return {
    filteredEmotes,
    allEmotes,
  };
}
