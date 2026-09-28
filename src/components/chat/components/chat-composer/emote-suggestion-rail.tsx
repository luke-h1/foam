import { useDeferredValue } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { SanitisedEmote } from '@app/types/emote';

import { EmoteSuggestions } from './components/emote-suggestions';
import { useEmoteSuggestions } from './hooks/use-emote-suggestions';
import {
  suggestionRailEntering,
  suggestionRailExiting,
} from './util/suggestion-rail-animations';

interface EmoteSuggestionRailProps {
  handleEmotePress: (emote: SanitisedEmote) => void;
  maxSuggestions: number;
  prioritizeChannelEmotes: boolean;
  searchTerm: string;
}

export function EmoteSuggestionRail({
  handleEmotePress,
  maxSuggestions,
  prioritizeChannelEmotes,
  searchTerm,
}: EmoteSuggestionRailProps) {
  const deferredEmoteSearchTerm = useDeferredValue(searchTerm);

  const { filteredEmotes } = useEmoteSuggestions({
    searchTerm: deferredEmoteSearchTerm,
    maxSuggestions,
    prioritizeChannelEmotes,
  });

  if (filteredEmotes.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={styles.suggestionRail}
      entering={suggestionRailEntering}
      exiting={suggestionRailExiting}
    >
      <EmoteSuggestions
        emotes={filteredEmotes}
        handleEmotePress={handleEmotePress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  suggestionRail: {
    bottom: '100%',
    left: 0,
    paddingBottom: 6,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
});
