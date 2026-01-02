import { Button } from '@app/components/Button';
import { Text } from '@app/components/Text';
import { ChatUser } from '@app/store/chatStore';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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

const styles = StyleSheet.create(theme => ({
  userSuggestionsWrapper: {
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  userSuggestionsContainer: {
    backgroundColor: theme.colors.accent.accent,
    borderRadius: theme.radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.accent.accent,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userSuggestionScroll: {
    flexDirection: 'row',
  },
  userSuggestionItem: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.accent.accentHover,
  },
  userSuggestionText: {
    fontWeight: '500',
  },
}));
