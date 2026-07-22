import { memo, useCallback } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';

import {
  suggestionRailColors,
  suggestionRailStyles,
} from '../suggestionRailStyles';

const EMOTE_SUGGESTION_ITEM_SIZE = 48;

interface EmoteSuggestionsProps {
  emotes: SanitisedEmote[];
  handleEmotePress: (set: SanitisedEmote) => void;
}

const EmoteSuggestionItem = memo(function EmoteSuggestionItem({
  item,
  onPress,
}: {
  item: SanitisedEmote;
  onPress: (emote: SanitisedEmote) => void;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const railColors = suggestionRailColors[scheme];
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Button
      style={[
        styles.suggestionItem,
        {
          backgroundColor: railColors.chipBackground,
          borderColor: railColors.chipBorder,
        },
      ]}
      onPress={handlePress}
    >
      <Image
        source={item.url}
        cacheVariant='emote'
        style={styles.emoteImage}
        trackLoadContext='chat.emote-suggestions'
      />
      <View style={styles.emoteTextContainer}>
        <Text
          style={[styles.emoteName, { color: railColors.text }]}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {item.name}
        </Text>
        <Text
          style={[styles.emoteSite, { color: railColors.secondaryText }]}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {item.site}
        </Text>
      </View>
    </Button>
  );
});

export const EmoteSuggestions = memo(function EmoteSuggestions({
  emotes,
  handleEmotePress,
}: EmoteSuggestionsProps) {
  const { t } = useTranslation('chat');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const railStyles = suggestionRailStyles[scheme];

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<SanitisedEmote>) => (
      <EmoteSuggestionItem item={item} onPress={handleEmotePress} />
    ),
    [handleEmotePress],
  );

  return (
    <View style={railStyles.richWrapper}>
      <View style={railStyles.richContainer}>
        <Text style={railStyles.headerLabel}>{t('composer.emotes')}</Text>
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
    height: 28,
    width: 28,
  },
  emoteName: {
    flexShrink: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  emoteSite: {
    flexShrink: 1,
    fontSize: theme.fontSize12,
  },
  emoteTextContainer: {
    gap: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  scrollContent: {
    gap: theme.space8,
    paddingRight: theme.space8,
  },
  suggestionItem: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 48,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
});
