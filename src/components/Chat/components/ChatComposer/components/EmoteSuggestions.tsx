import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

interface EmoteSuggestionsProps {
  emotes: SanitisedEmote[];
  handleEmotePress: (set: SanitisedEmote) => void;
  showSuggestions: boolean;
  setShowSuggestions: (val: boolean) => void;
  inputLayout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  suggestionOpacity: number;
  suggestionScale: number;
  suggestionTranslateY: number;
}

export function EmoteSuggestions({
  emotes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSuggestions: _showSuggestions,
  handleEmotePress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setShowSuggestions: _setShowSuggestions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  inputLayout: _inputLayout,
  suggestionOpacity,
  suggestionScale,
  suggestionTranslateY,
}: EmoteSuggestionsProps) {
  const suggestionsHeight = 280;

  const suggestionStyle = {
    opacity: suggestionOpacity,
    transform: [
      { scale: suggestionScale },
      { translateY: suggestionTranslateY },
    ],
    height: suggestionsHeight,
    maxHeight: suggestionsHeight,
  };

  const renderEmoteItem: ListRenderItem<SanitisedEmote> = useCallback(
    ({ item }) => (
      <View style={styles.animatedItem}>
        <Button
          style={styles.suggestionItem}
          onPress={() => handleEmotePress(item)}
        >
          <View style={styles.emoteContainer}>
            <View>
              <Image source={item.url} style={styles.emoteImage} useNitro />
            </View>
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
          </View>
        </Button>
      </View>
    ),
    [handleEmotePress],
  );

  if (suggestionOpacity === 0) {
    return null;
  }

  return (
    <View
      style={[styles.suggestionsContainer, suggestionStyle]}
      pointerEvents="box-none"
    >
      <FlashList
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        data={emotes}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={renderEmoteItem}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  animatedItem: {},
  emoteContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.sm,
  },
  emoteImage: {
    height: 32,
    width: 32,
  },
  emoteName: {
    flexShrink: 1,
    fontWeight: '500',
  },
  emoteSite: {
    flexShrink: 1,
    marginTop: 2,
  },
  emoteTextContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  list: { height: 280 },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.gray.bg,
    borderColor: theme.colors.gray.border,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
});
