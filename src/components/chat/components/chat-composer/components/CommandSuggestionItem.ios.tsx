import { StyleSheet } from 'react-native';

import { Button } from '@app/components/button/Button';
import type { SlashCommandDefinition } from '@app/components/chat/util/slash-command-definitions/types';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

import { SUGGESTION_ITEM_WIDTH } from '../constants';
import { suggestionRailColors } from './SuggestionRail.styles';
import type { SuggestionItemProps } from './SuggestionRail.types';

export function CommandSuggestionItem({
  item,
  onSelect,
}: SuggestionItemProps<SlashCommandDefinition>) {
  return (
    <Button onPress={() => onSelect(item)} style={styles.suggestionItem}>
      <Text type='callout' family='brand' style={styles.commandName}>
        /{item.name}
      </Text>
    </Button>
  );
}

const styles = StyleSheet.create({
  commandName: {
    color: suggestionRailColors.text,
    fontSize: theme.fontSize14,
    fontWeight: '500',
    maxWidth: 150,
  },
  suggestionItem: {
    alignItems: 'center',
    backgroundColor: suggestionRailColors.chipBackground,
    borderColor: suggestionRailColors.chipBorder,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 38,
    minWidth: SUGGESTION_ITEM_WIDTH.command,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
