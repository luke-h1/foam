import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import type { SlashCommandDefinition } from '@app/components/Chat/util/slashCommandDefinitions/types';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

const COMMAND_SUGGESTION_ITEM_SIZE = 48;

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
    <Button style={styles.suggestionItem} onPress={() => onPress(item)}>
      <View style={styles.commandTextContainer}>
        <Text style={styles.commandName} numberOfLines={1} ellipsizeMode='tail'>
          /{item.name}
        </Text>
        <Text
          style={styles.commandDescription}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {item.description}
        </Text>
      </View>
    </Button>
  );
}

export const CommandSuggestions = memo(function CommandSuggestions({
  commands,
  handleCommandSelect,
}: CommandSuggestionsProps) {
  const { t } = useTranslation('chat');
  const extraData = useMemo<CommandSuggestionListExtra>(
    () => ({ onPress: handleCommandSelect }),
    [handleCommandSelect],
  );

  return (
    <View style={styles.suggestionsWrapper}>
      <View style={styles.suggestionsContainer}>
        <Text style={styles.headerLabel}>{t('composer.commands')}</Text>
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
  commandDescription: {
    color: theme.color.textSecondary.dark,
    flexShrink: 1,
    fontSize: theme.fontSize12,
    marginTop: 1,
  },
  commandName: {
    flexShrink: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  commandTextContainer: {
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
    minHeight: COMMAND_SUGGESTION_ITEM_SIZE,
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
