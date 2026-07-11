import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import type { SanitisedEmote } from '@app/types/emote';

import { suggestionRailStyles } from '../suggestionRailStyles';

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
    <View style={suggestionRailStyles.compactWrapper}>
      <View style={suggestionRailStyles.compactContainer}>
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
});
