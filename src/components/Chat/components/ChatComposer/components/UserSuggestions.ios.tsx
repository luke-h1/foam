import { memo } from 'react';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import type { ChatUser } from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';
import { LegendList, type LegendListRenderItemProps } from '@legendapp/list';
import { StyleSheet, View } from 'react-native';

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
      <Text style={styles.userSuggestionText}>@{user.name}</Text>
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
  userColorDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  userSuggestionItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 14,
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
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: '500',
    maxWidth: 150,
  },
  userSuggestionsContainer: {
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
  userSuggestionsWrapper: {
    marginBottom: 6,
    maxWidth: '100%',
    zIndex: 2,
  },
});
