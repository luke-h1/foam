import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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

function createRenderEmoteSuggestionItem(
  onPress: (emote: SanitisedEmote) => void,
) {
  return function RenderEmoteSuggestionItem({
    item,
  }: LegendListRenderItemProps<SanitisedEmote>) {
    return <EmoteSuggestionItem item={item} onPress={onPress} />;
  };
}

function EmoteSuggestionItem({
  item,
  onPress,
}: {
  item: SanitisedEmote;
  onPress: (emote: SanitisedEmote) => void;
}) {
  return (
    <Button style={styles.suggestionItem} onPress={() => onPress(item)}>
      <Image
        source={item.url}
        cacheVariant='emote'
        style={styles.emoteImage}
        trackLoadContext='chat.emote-suggestions'
      />
      <View style={styles.emoteTextContainer}>
        <Text style={styles.emoteName} numberOfLines={1} ellipsizeMode='tail'>
          {item.name}
        </Text>
        <Text style={styles.emoteSite} numberOfLines={1} ellipsizeMode='tail'>
          {item.site}
        </Text>
      </View>
    </Button>
  );
}

export const EmoteSuggestions = memo(function EmoteSuggestions({
  emotes,
  handleEmotePress,
}: EmoteSuggestionsProps) {
  const { t } = useTranslation('chat');
  const renderItem = useMemo(
    () => createRenderEmoteSuggestionItem(handleEmotePress),
    [handleEmotePress],
  );

  return (
    <View style={suggestionRailStyles.richWrapper}>
      <View style={suggestionRailStyles.richContainer}>
        <Text style={suggestionRailStyles.headerLabel}>
          {t('composer.emotes')}
        </Text>
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
    color: suggestionRailColors.text,
    flexShrink: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  emoteSite: {
    color: suggestionRailColors.secondaryText,
    flexShrink: 1,
    fontSize: theme.fontSize12,
    marginTop: 1,
  },
  emoteTextContainer: {
    justifyContent: 'center',
    minWidth: 0,
  },
  scrollContent: {
    gap: theme.space8,
    paddingRight: theme.space8,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: suggestionRailColors.chipBackground,
    borderColor: suggestionRailColors.chipBorder,
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
