import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import type { SlashCommandDefinition } from '@app/components/Chat/util/slashCommandDefinitions';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

const COMMAND_SUGGESTION_ITEM_SIZE = 128;

interface CommandSuggestionsProps {
  commands: SlashCommandDefinition[];
  handleCommandSelect: (command: SlashCommandDefinition) => void;
  suggestionOpacity: number;
  suggestionScale: number;
  suggestionTranslateY: number;
}

type CommandSuggestionListExtra = {
  onPress: (command: SlashCommandDefinition) => void;
};

function renderCommandSuggestionItem({
  item,
  extraData,
}: LegendListRenderItemProps<SlashCommandDefinition>) {
  const { onPress }: CommandSuggestionListExtra = extraData;
  return <CommandSuggestionItem item={item} onPress={onPress} />;
}

function CommandSuggestionItem({
  item,
  onPress,
}: {
  item: SlashCommandDefinition;
  onPress: (command: SlashCommandDefinition) => void;
}) {
  return (
    <Button onPress={() => onPress(item)} style={styles.suggestionItem}>
      <Text style={styles.commandName}>/{item.name}</Text>
    </Button>
  );
}

export const CommandSuggestions = memo(function CommandSuggestions({
  commands,
  handleCommandSelect,
  suggestionOpacity,
  suggestionScale,
  suggestionTranslateY,
}: CommandSuggestionsProps) {
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
        <LegendList
          data={commands}
          horizontal
          estimatedItemSize={COMMAND_SUGGESTION_ITEM_SIZE}
          keyExtractor={item => item.name}
          keyboardShouldPersistTaps='handled'
          extraData={{ onPress: handleCommandSelect }}
          renderItem={renderCommandSuggestionItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  commandName: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: '500',
    maxWidth: 150,
  },
  scrollContent: {
    gap: 4,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 38,
    minWidth: COMMAND_SUGGESTION_ITEM_SIZE,
    paddingHorizontal: 8,
    paddingVertical: 5,
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
