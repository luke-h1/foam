import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import type { SanitisedEmote } from '@app/types/emote';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

interface EmoteSuggestionsProps {
  emotes: SanitisedEmote[];
  handleEmotePress: (set: SanitisedEmote) => void;
  suggestionOpacity: number;
  suggestionScale: number;
  suggestionTranslateY: number;
}

export const EmoteSuggestions = memo(function EmoteSuggestions({
  emotes,
  handleEmotePress,
  suggestionOpacity,
  suggestionScale,
  suggestionTranslateY,
}: EmoteSuggestionsProps) {
  const suggestionStyle = {
    opacity: suggestionOpacity,
    transform: [
      { scale: suggestionScale },
      { translateY: suggestionTranslateY },
    ],
  };

  if (suggestionOpacity === 0) {
    return null;
  }

  return (
    <View style={[styles.suggestionsWrapper, suggestionStyle]}>
      <View style={styles.suggestionsContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          {emotes.map(item => (
            <Button
              key={item.id}
              onPress={() => handleEmotePress(item)}
              style={styles.suggestionItem}
            >
              <View style={styles.emoteTile}>
                <Image
                  contentFit="contain"
                  source={item.url}
                  style={styles.emoteImage}
                  useNitro
                />
              </View>
            </Button>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

EmoteSuggestions.displayName = 'EmoteSuggestions';

const styles = StyleSheet.create({
  emoteImage: {
    height: 32,
    width: 32,
  },
  emoteTile: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  scrollContent: {
    gap: 4,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    minHeight: 44,
    minWidth: 44,
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(28,28,30,0.94)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    paddingBottom: 4,
    paddingHorizontal: 4,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  suggestionsWrapper: {
    marginBottom: 6,
    maxWidth: '100%',
    zIndex: 2,
  },
});
