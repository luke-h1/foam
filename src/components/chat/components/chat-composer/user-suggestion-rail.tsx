import { useDeferredValue } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ChatUser } from '@app/store/chat/types/constants';

import { UserSuggestions } from './components/user-suggestions';
import { useUserSuggestions } from './hooks/use-user-suggestions';
import {
  suggestionRailEntering,
  suggestionRailExiting,
} from './util/suggestion-rail-animations';

interface UserSuggestionRailProps {
  handleUserSelect: (user: ChatUser) => void;
  maxSuggestions: number;
  searchTerm: string;
}

export function UserSuggestionRail({
  handleUserSelect,
  maxSuggestions,
  searchTerm,
}: UserSuggestionRailProps) {
  const deferredMentionWord = useDeferredValue(searchTerm);

  const { filteredUsers } = useUserSuggestions({
    searchTerm: deferredMentionWord,
    enabled: true,
    maxSuggestions,
  });

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={styles.suggestionRail}
      entering={suggestionRailEntering}
      exiting={suggestionRailExiting}
    >
      <UserSuggestions
        users={filteredUsers}
        showUserSuggestions
        handleUserSelect={handleUserSelect}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  suggestionRail: {
    bottom: '100%',
    left: 0,
    paddingBottom: 6,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
});
