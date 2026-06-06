import { memo } from 'react';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import type { ChatUser } from '@app/store/chatStore/constants';
import { theme } from '@app/styles/themes';
import { LegendList, type LegendListRenderItemProps } from '@legendapp/list';
import { StyleSheet, View } from 'react-native';

const USER_SUGGESTION_ITEM_SIZE = 40;

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
    <Button style={styles.userSuggestionItem} onPress={() => onPress(user)}>
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
  if (!showUserSuggestions || users.length === 0) {
    return null;
  }

  return (
    <View style={styles.userSuggestionsWrapper}>
      <View style={styles.userSuggestionsContainer}>
        <Text style={styles.headerLabel}>Mention</Text>
        <LegendList
          data={users}
          horizontal
          estimatedItemSize={USER_SUGGESTION_ITEM_SIZE}
          keyExtractor={user => user.userId}
          keyboardShouldPersistTaps='handled'
          extraData={{ onPress: handleUserSelect }}
          renderItem={renderUserSuggestionItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.userSuggestionScroll}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    fontWeight: '700',
    letterSpacing: 0.3,
    paddingBottom: theme.space8,
    textTransform: 'uppercase',
  },
  userColorDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  userSuggestionItem: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  userSuggestionScroll: {
    gap: theme.space8,
    paddingRight: theme.space8,
  },
  userSuggestionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  userSuggestionsContainer: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
    paddingBottom: theme.space12,
    paddingTop: theme.space12,
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.18)',
  },
  userSuggestionsWrapper: {
    marginBottom: theme.space8,
    width: '100%',
    zIndex: 2,
  },
});
