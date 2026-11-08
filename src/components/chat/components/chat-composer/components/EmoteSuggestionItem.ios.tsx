import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@app/components/button/Button';
import { Image } from '@app/components/image/Image';
import type { SanitisedEmote } from '@app/types/emote';

import { SUGGESTION_ITEM_WIDTH } from '../constants';
import type { SuggestionItemProps } from './SuggestionRail.types';

export const EmoteSuggestionItem = memo(function EmoteSuggestionItem({
  item,
  onSelect,
}: SuggestionItemProps<SanitisedEmote>) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <Button onPress={handlePress} style={styles.suggestionItem}>
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
});

const styles = StyleSheet.create({
  emoteImage: {
    height: 32,
    width: 32,
  },
  emoteTile: {
    alignItems: 'center',
    height: SUGGESTION_ITEM_WIDTH.emote,
    justifyContent: 'center',
    overflow: 'hidden',
    width: SUGGESTION_ITEM_WIDTH.emote,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    minHeight: SUGGESTION_ITEM_WIDTH.emote,
    minWidth: SUGGESTION_ITEM_WIDTH.emote,
  },
});
