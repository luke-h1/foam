import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import type { SanitisedEmote } from '@app/types/emote';

const EMOTE_SUGGESTION_ITEM_SIZE = 44;

interface EmoteSuggestionsProps {
  emotes: SanitisedEmote[];
  handleEmotePress: (set: SanitisedEmote) => void;
}

function createRenderEmoteSuggestionItem(
  onPress: (emote: SanitisedEmote) => void,
) {
  return function RenderEmoteSuggestionItem({
    item,
  }: LegendListRenderItemProps<SanitisedEmote>) {
    return <EmoteSuggestionTile item={item} onPress={onPress} />;
  };
}

function EmoteSuggestionTile({
  item,
  onPress,
}: {
  item: SanitisedEmote;
  onPress: (emote: SanitisedEmote) => void;
}) {
  return (
    <Button onPress={() => onPress(item)} style={styles.suggestionItem}>
      <View style={styles.emoteTile}>
        <Image
          contentFit='contain'
          source={item.url}
          cacheVariant='emote'
          style={styles.emoteImage}
          trackLoadContext='chat.emote-suggestions'
        />
      </View>
    </Button>
  );
}

export const EmoteSuggestions = memo(function EmoteSuggestions({
  emotes,
  handleEmotePress,
}: EmoteSuggestionsProps) {
  const renderItem = useMemo(
    () => createRenderEmoteSuggestionItem(handleEmotePress),
    [handleEmotePress],
  );

  return (
    <View style={styles.suggestionsWrapper}>
      <View style={styles.suggestionsContainer}>
        <LegendList
          data={emotes}
          horizontal
          estimatedItemSize={EMOTE_SUGGESTION_ITEM_SIZE}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps='handled'
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
      </View>
    </View>
  );
});

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
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.16)',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  suggestionsWrapper: {
    marginBottom: 6,
    maxWidth: '100%',
    zIndex: 2,
  },
});
