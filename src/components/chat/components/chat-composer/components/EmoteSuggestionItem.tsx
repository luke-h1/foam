import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@app/components/button/Button';
import { Image } from '@app/components/image/Image';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';

import { suggestionRailColors } from './SuggestionRail.styles';
import type { SuggestionItemProps } from './SuggestionRail.types';

export const EmoteSuggestionItem = memo(function EmoteSuggestionItem({
  item,
  onSelect,
}: SuggestionItemProps<SanitisedEmote>) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <Button style={styles.suggestionItem} onPress={handlePress}>
      <Image
        source={item.url}
        cacheVariant='emote'
        style={styles.emoteImage}
        trackLoadContext='chat.emote-suggestions'
      />
      <View style={styles.emoteTextContainer}>
        <Text
          type='callout'
          family='brand'
          style={styles.emoteName}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {item.name}
        </Text>
        <Text
          type='callout'
          family='brand'
          style={styles.emoteSite}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {item.site}
        </Text>
      </View>
    </Button>
  );
});

const styles = StyleSheet.create({
  emoteImage: {
    height: 28,
    width: 28,
  },
  emoteName: {
    color: suggestionRailColors.text,
    flexShrink: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  emoteSite: {
    color: suggestionRailColors.secondaryText,
    flexShrink: 1,
    fontSize: theme.fontSize12,
  },
  emoteTextContainer: {
    gap: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: suggestionRailColors.chipBackground,
    borderColor: suggestionRailColors.chipBorder,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 48,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
});
