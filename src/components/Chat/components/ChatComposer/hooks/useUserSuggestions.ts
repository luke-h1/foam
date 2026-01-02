import { ChatUser, useTtvUsers } from '@app/store/chatStore';
import { useMemo } from 'react';

interface UseUserSuggestionsProps {
  searchTerm: string;
  enabled: boolean;
}

export function useUserSuggestions({
  searchTerm,
  enabled,
}: UseUserSuggestionsProps) {
  const ttvUsers = useTtvUsers();

  const filteredUsers = useMemo(() => {
    if (!enabled || !searchTerm.trim()) {
      return [];
    }

    // Remove @ prefix for search
    const cleanSearch = searchTerm.slice(1).toLowerCase().trim();

    if (cleanSearch.length < 1) {
      return [];
    }

    const results: ChatUser[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const user of ttvUsers) {
      // eslint-disable-next-line no-continue
      if (!user?.name) continue;

      const userName = user.name.toLowerCase();
      if (userName.includes(cleanSearch)) {
        results.push(user);
      }
    }

    return results;
  }, [ttvUsers, searchTerm, enabled]);

  return {
    filteredUsers,
  };
}
