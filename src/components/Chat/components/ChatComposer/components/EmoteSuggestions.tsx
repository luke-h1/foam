import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
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
        <Text style={styles.headerLabel}>Emotes</Text>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          {emotes.map(item => (
            <Button
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => handleEmotePress(item)}
            >
              <Image
                source={item.url}
                style={styles.emoteImage}
                useNitro
                trackLoadTime
                trackLoadContext="chat.emote-suggestions"
              />
              <View style={styles.emoteTextContainer}>
                <Text
                  style={styles.emoteName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Text>
                <Text
                  style={styles.emoteSite}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.site}
                </Text>
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
    height: 28,
    width: 28,
  },
  emoteName: {
    flexShrink: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  emoteSite: {
    color: theme.color.textSecondary.dark,
    flexShrink: 1,
    fontSize: theme.fontSize12,
    marginTop: 1,
  },
  emoteTextContainer: {
    justifyContent: 'center',
    minWidth: 0,
  },
  headerLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    fontWeight: '700',
    letterSpacing: 0.3,
    paddingBottom: theme.space8,
    textTransform: 'uppercase',
  },
  scrollContent: {
    gap: theme.space8,
    paddingRight: theme.space8,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 48,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  suggestionsContainer: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space12,
    paddingBottom: theme.space12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  suggestionsWrapper: {
    marginBottom: theme.space8,
    width: '100%',
    zIndex: 2,
  },
});
