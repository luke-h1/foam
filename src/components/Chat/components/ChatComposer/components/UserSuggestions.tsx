import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import type { ChatUser } from '@app/store/chatStore/constants';
import { theme } from '@app/styles/themes';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

interface UserSuggestionsProps {
  users: ChatUser[];
  showUserSuggestions: boolean;
  handleUserSelect: (user: ChatUser) => void;
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
        <ScrollView
          contentContainerStyle={styles.userSuggestionScroll}
          horizontal
          keyboardShouldPersistTaps='handled'
          showsHorizontalScrollIndicator={false}
        >
          {users.map(user => (
            <Button
              key={user?.userId}
              style={styles.userSuggestionItem}
              onPress={() => handleUserSelect(user)}
            >
              <View
                style={[
                  styles.userColorDot,
                  {
                    backgroundColor:
                      user?.color || theme.color.textSecondary.dark,
                  },
                ]}
              />
              <Text style={styles.userSuggestionText}>{user?.name}</Text>
            </Button>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

UserSuggestions.displayName = 'UserSuggestions';

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
    flexDirection: 'row',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  userSuggestionsWrapper: {
    marginBottom: theme.space8,
    width: '100%',
    zIndex: 2,
  },
});
