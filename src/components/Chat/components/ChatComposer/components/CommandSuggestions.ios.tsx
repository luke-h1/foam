import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import type { SlashCommandDefinition } from '@app/components/Chat/util/slashCommandDefinitions/types';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import {
  suggestionRailColors,
  suggestionRailStyles,
} from '../suggestionRailStyles';

const COMMAND_SUGGESTION_ITEM_SIZE = 128;

interface CommandSuggestionsProps {
  commands: SlashCommandDefinition[];
  handleCommandSelect: (command: SlashCommandDefinition) => void;
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
}: CommandSuggestionsProps) {
  const extraData = useMemo<CommandSuggestionListExtra>(
    () => ({ onPress: handleCommandSelect }),
    [handleCommandSelect],
  );

  return (
    <View style={suggestionRailStyles.compactWrapper}>
      <View style={suggestionRailStyles.compactContainer}>
        <LegendList
          data={commands}
          horizontal
          estimatedItemSize={COMMAND_SUGGESTION_ITEM_SIZE}
          keyExtractor={item => item.name}
          keyboardShouldPersistTaps='handled'
          extraData={extraData}
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
    color: suggestionRailColors.text,
    fontSize: theme.fontSize14,
    fontWeight: '500',
    maxWidth: 150,
  },
  scrollContent: {
    gap: 4,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: suggestionRailColors.chipBackground,
    borderColor: suggestionRailColors.chipBorder,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius14,
    borderWidth: 1,
    minHeight: 38,
    minWidth: COMMAND_SUGGESTION_ITEM_SIZE,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
