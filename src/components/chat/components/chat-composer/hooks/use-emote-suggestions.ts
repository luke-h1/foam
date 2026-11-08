import { useMemo } from 'react';

import {
  useCurrentEmoteData,
  useEmojis,
} from '@app/store/chat/react/selectors';
import type { SanitisedEmote } from '@app/types/emote';
import { normaliseChatText } from '@app/utils/chat/normaliseChatText';

interface SearchableEmote {
  emote: SanitisedEmote;
  isChannel: boolean;
  lowerName: string;
  lowerOriginalName?: string;
}

interface UseEmoteSuggestionsOptions {
  searchTerm: string;
  maxSuggestions?: number;
}

function buildSearchableEmotes(emoteSources: {
  sevenTvChannelEmotes: (SanitisedEmote | undefined)[];
  sevenTvGlobalEmotes: (SanitisedEmote | undefined)[];
  twitchChannelEmotes: (SanitisedEmote | undefined)[];
  twitchGlobalEmotes: (SanitisedEmote | undefined)[];
  bttvChannelEmotes: (SanitisedEmote | undefined)[];
  bttvGlobalEmotes: (SanitisedEmote | undefined)[];
  ffzChannelEmotes: (SanitisedEmote | undefined)[];
  ffzGlobalEmotes: (SanitisedEmote | undefined)[];
  emojis: (SanitisedEmote | undefined)[];
}): SearchableEmote[] {
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
        emote.provider === 'emoji'
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
    if (a.isChannel !== b.isChannel) {
      return a.isChannel ? -1 : 1;
    }

    return a.emote.name.localeCompare(b.emote.name);
  });

  return uniqueEmotes;
}

function matchesSearch(entry: SearchableEmote, lowerSearch: string): boolean {
  return (
    entry.lowerName.includes(lowerSearch) ||
    (entry.lowerOriginalName?.includes(lowerSearch) ?? false)
  );
}

export function useEmoteSuggestions({
  searchTerm,
  maxSuggestions = 50,
}: UseEmoteSuggestionsOptions) {
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

  const searchableEmotes = useMemo(
    () =>
      buildSearchableEmotes({
        sevenTvChannelEmotes,
        sevenTvGlobalEmotes,
        twitchChannelEmotes,
        twitchGlobalEmotes,
        bttvChannelEmotes,
        bttvGlobalEmotes,
        ffzChannelEmotes,
        ffzGlobalEmotes,
        emojis,
      }),
    [
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      emojis,
    ],
  );

  const lowerSearch = normaliseChatText(searchTerm);

  const filteredEmotes = useMemo(() => {
    if (lowerSearch.length < 1) {
      return [];
    }

    const matches: SanitisedEmote[] = [];

    for (const entry of searchableEmotes) {
      if (matches.length >= maxSuggestions) {
        break;
      }

      if (matchesSearch(entry, lowerSearch)) {
        matches.push(entry.emote);
      }
    }

    return matches;
  }, [lowerSearch, maxSuggestions, searchableEmotes]);

  return {
    filteredEmotes,
  };
}
