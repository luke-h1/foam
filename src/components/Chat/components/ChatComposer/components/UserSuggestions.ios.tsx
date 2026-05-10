import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
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
        <ScrollView
          contentContainerStyle={styles.userSuggestionScroll}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          {users.map(user => (
            <Button
              key={user?.userId}
              onPress={() => handleUserSelect(user)}
              style={styles.userSuggestionItem}
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
              <Text style={styles.userSuggestionText}>@{user?.name}</Text>
            </Button>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

UserSuggestions.displayName = 'UserSuggestions';

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
    flexDirection: 'row',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  userSuggestionsWrapper: {
    marginBottom: 6,
    maxWidth: '100%',
    zIndex: 2,
  },
});
