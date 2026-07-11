import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  LegendList,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import type { ChatUser } from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';

import {
  suggestionRailColors,
  suggestionRailStyles,
} from '../suggestionRailStyles';

const USER_SUGGESTION_ITEM_SIZE = 128;

interface UserSuggestionsProps {
  users: ChatUser[];
  showUserSuggestions: boolean;
  handleUserSelect: (user: ChatUser) => void;
}

type UserSuggestionListExtra = {
  onPress: (user: ChatUser) => void;
};

/**
 * Module-level `renderItem` for the suggestions LegendList.
 *
 * Defined outside the parent component so the reference is stable across
 * re-renders (avoids LegendList tearing down rows when the parent re-renders).
 * The press handler is threaded through `extraData` rather than captured in a
 * closure for the same reason — keeps this function pure and reusable.
 */
function renderUserSuggestionItem({
  item,
  extraData,
}: LegendListRenderItemProps<ChatUser>) {
  const { onPress }: UserSuggestionListExtra = extraData;
  return <UserSuggestionItem user={item} onPress={onPress} />;
}

function UserSuggestionItem({
  user,
  onPress,
}: {
  user: ChatUser;
  onPress: (selected: ChatUser) => void;
}) {
  return (
    <Button onPress={() => onPress(user)} style={styles.userSuggestionItem}>
      <View
        style={[
          styles.userColorDot,
          {
            backgroundColor: user.color || theme.color.textSecondary.dark,
          },
        ]}
      />
      <Text style={styles.userSuggestionText}>{user.name}</Text>
    </Button>
  );
}

export const UserSuggestions = memo(function UserSuggestions({
  users,
  showUserSuggestions,
  handleUserSelect,
}: UserSuggestionsProps) {
  const extraData = useMemo(
    () => ({ onPress: handleUserSelect }),
    [handleUserSelect],
  );

  if (!showUserSuggestions || users.length === 0) {
    return null;
  }

  return (
    <View style={suggestionRailStyles.compactWrapper}>
      <View style={suggestionRailStyles.compactContainer}>
        <LegendList
          data={users}
          horizontal
          estimatedItemSize={USER_SUGGESTION_ITEM_SIZE}
          keyExtractor={user => user.userId}
          keyboardShouldPersistTaps='handled'
          extraData={extraData}
          renderItem={renderUserSuggestionItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.userSuggestionScroll}
        />
      </View>
    </View>
  );
});

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
    borderRadius: theme.borderRadius14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 38,
    minWidth: 128,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  userSuggestionScroll: {
    gap: 4,
  },
  userSuggestionText: {
    color: suggestionRailColors.text,
    fontSize: theme.fontSize14,
    fontWeight: '500',
    maxWidth: 150,
  },
});
