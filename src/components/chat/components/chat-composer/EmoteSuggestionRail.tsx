import { useDeferredValue } from 'react';

import type { SanitisedEmote } from '@app/types/emote';

import { EmoteSuggestionItem } from './components/EmoteSuggestionItem';
import { SuggestionRail } from './components/SuggestionRail';
import { SUGGESTION_ITEM_WIDTH } from './constants';
import { useEmoteSuggestions } from './hooks/use-emote-suggestions';

interface EmoteSuggestionRailProps {
  onSelect: (emote: SanitisedEmote) => void;
  searchTerm: string;
}

function getEmoteKey(emote: SanitisedEmote): string {
  return emote.id;
}

export function EmoteSuggestionRail({
  onSelect,
  searchTerm,
}: EmoteSuggestionRailProps) {
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const { filteredEmotes } = useEmoteSuggestions({
    searchTerm: deferredSearchTerm,
  });

  return (
    <SuggestionRail
      estimatedItemSize={SUGGESTION_ITEM_WIDTH.emote}
      Item={EmoteSuggestionItem}
      items={filteredEmotes}
      keyExtractor={getEmoteKey}
      onSelect={onSelect}
      title='Emotes'
    />
  );
}
