import { StyleSheet, View } from 'react-native';

import { Button } from '@app/components/button/Button';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';
import type { ChatUser } from '@app/types/chat/chatMessage';

import { SUGGESTION_ITEM_WIDTH } from '../constants';
import { suggestionRailColors } from './SuggestionRail.styles';
import type { SuggestionItemProps } from './SuggestionRail.types';

export function UserSuggestionItem({
  item,
  onSelect,
}: SuggestionItemProps<ChatUser>) {
  return (
    <Button style={styles.userSuggestionItem} onPress={() => onSelect(item)}>
      <View
        style={[
          styles.userColorDot,
          {
            backgroundColor: item.color || theme.color.textSecondary.dark,
          },
        ]}
      />
      <Text type='callout' family='brand' style={styles.userSuggestionText}>
        {item.name}
      </Text>
    </Button>
  );
}

const styles = StyleSheet.create({
  userColorDot: {
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  userSuggestionItem: {
    alignItems: 'center',
    backgroundColor: suggestionRailColors.chipBackground,
    borderColor: suggestionRailColors.chipBorder,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    borderRadius: theme.radius.md,
    minHeight: 38,
    minWidth: SUGGESTION_ITEM_WIDTH.user,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  userSuggestionText: {
    color: suggestionRailColors.text,
    fontSize: theme.fontSize14,
    fontWeight: '500',
    maxWidth: 150,
  },
});
