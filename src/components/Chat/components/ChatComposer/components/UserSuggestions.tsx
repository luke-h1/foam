import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import type { ChatUser } from '@app/store/chatStore/constants';
import { theme } from '@app/styles/themes';
import { ScrollView, View, StyleSheet } from 'react-native';

interface UserSuggestionsProps {
  users: ChatUser[];
  showUserSuggestions: boolean;
  handleUserSelect: (user: ChatUser) => void;
}

export function UserSuggestions({
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.userSuggestionScroll}
          keyboardShouldPersistTaps="handled"
        >
          {users.map(user => (
            <Button
              key={user?.userId}
              style={styles.userSuggestionItem}
              onPress={() => handleUserSelect(user)}
            >
              <Text style={[styles.userSuggestionText, { color: user?.color }]}>
                {user?.name}
              </Text>
            </Button>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userSuggestionItem: {
    backgroundColor: theme.colors.accent.accentHover,
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  userSuggestionScroll: {
    flexDirection: 'row',
  },
  userSuggestionText: {
    fontWeight: '500',
  },
  userSuggestionsContainer: {
    backgroundColor: theme.colors.accent.accent,
    borderColor: theme.colors.accent.accent,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    elevation: 3,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userSuggestionsWrapper: {
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
});
