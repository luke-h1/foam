import { StyleSheet, View } from 'react-native';

import { Button } from '@app/components/button/Button';
import type { SlashCommandDefinition } from '@app/components/chat/util/slash-command-definitions/types';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

import { suggestionRailColors } from './SuggestionRail.styles';
import type { SuggestionItemProps } from './SuggestionRail.types';

export function CommandSuggestionItem({
  item,
  onSelect,
}: SuggestionItemProps<SlashCommandDefinition>) {
  return (
    <Button style={styles.suggestionItem} onPress={() => onSelect(item)}>
      <View style={styles.commandTextContainer}>
        <Text
          type='callout'
          family='brand'
          style={styles.commandName}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          /{item.name}
        </Text>
        <Text
          type='callout'
          family='brand'
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

const styles = StyleSheet.create({
  commandDescription: {
    color: suggestionRailColors.secondaryText,
    flexShrink: 1,
    fontSize: theme.fontSize12,
  },
  commandName: {
    color: suggestionRailColors.text,
    flexShrink: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  commandTextContainer: {
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
