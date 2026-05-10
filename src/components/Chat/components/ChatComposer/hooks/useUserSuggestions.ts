import type { ChatUser } from '@app/store/chatStore/constants';
import { useTtvUsers } from '@app/store/chatStore/hooks';
import { useMemo } from 'react';

interface UseUserSuggestionsProps {
  searchTerm: string;
  enabled: boolean;
  maxSuggestions?: number;
}

export function useUserSuggestions({
  searchTerm,
  enabled,
  maxSuggestions = 20,
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

    for (const user of ttvUsers) {
      if (results.length >= maxSuggestions) {
        break;
      }
      if (!user?.name) continue;

      const userName = user.name.toLowerCase();
      if (userName.includes(cleanSearch)) {
        results.push(user);
      }
    }

    return results;
  }, [ttvUsers, searchTerm, enabled, maxSuggestions]);

  return {
    filteredUsers,
  };
}
