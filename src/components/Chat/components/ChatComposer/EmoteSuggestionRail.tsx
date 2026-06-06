import type { SanitisedEmote } from '@app/types/emote';
import { useDeferredValue } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmoteSuggestions } from './components/EmoteSuggestions';
import { useEmoteSuggestions } from './hooks/useEmoteSuggestions';
import { useSuggestionAnimations } from './hooks/useSuggestionAnimations';

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

  const { opacity, scale, translateY } = useSuggestionAnimations({
    shouldShow: filteredEmotes.length > 0,
  });

  if (filteredEmotes.length === 0) {
    return null;
  }

  return (
    <View style={styles.suggestionRail}>
      <EmoteSuggestions
        emotes={filteredEmotes}
        handleEmotePress={handleEmotePress}
        suggestionOpacity={opacity}
        suggestionScale={scale}
        suggestionTranslateY={translateY}
      />
    </View>
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
