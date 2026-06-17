import { memo, useMemo } from 'react';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const EMOTE_SUGGESTION_ITEM_SIZE = 48;

interface EmoteSuggestionsProps {
  emotes: SanitisedEmote[];
  handleEmotePress: (set: SanitisedEmote) => void;
  suggestionOpacity: number;
  suggestionScale: number;
  suggestionTranslateY: number;
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
        trackLoadTime
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
  suggestionOpacity,
  suggestionScale,
  suggestionTranslateY,
}: EmoteSuggestionsProps) {
  const { t } = useTranslation('chat');
  const renderItem = useMemo(
    () => createRenderEmoteSuggestionItem(handleEmotePress),
    [handleEmotePress],
  );
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
        <Text style={styles.headerLabel}>{t('composer.emotes')}</Text>
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
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.18)',
  },
  suggestionsWrapper: {
    marginBottom: theme.space8,
    width: '100%',
    zIndex: 2,
  },
});
