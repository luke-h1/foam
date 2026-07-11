import { useEffect, useMemo } from 'react';

import { useSelector } from '@legendapp/state/react';

import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { ChatUser } from '@app/store/chat/types/constants';
import { queueMentionLoginSearch } from '@app/utils/chat/mentionLoginResolver/queueMentionLoginSearch';
import { searchMentionChatters } from '@app/utils/chat/resolveMentionLogin/searchMentionChatters';
import { type MentionChatter } from '@app/utils/chat/resolveMentionLogin/types';

interface UseUserSuggestionsProps {
  searchTerm: string;
  enabled: boolean;
  maxSuggestions?: number;
}

function toChatUser(chatter: MentionChatter): ChatUser {
  return {
    avatar: null,
    color: chatter.color,
    name: `@${chatter.login}`,
    userId: chatter.userId,
  };
}

export function useUserSuggestions({
  searchTerm,
  enabled,
  maxSuggestions = 20,
}: UseUserSuggestionsProps) {
  const mentionLoginRevision = useSelector(chatStore$.mentionLoginRevision);
  const cleanSearch = searchTerm.slice(1).toLowerCase().trim();

  useEffect(() => {
    if (!enabled || cleanSearch.length < 2) {
      return;
    }

    queueMentionLoginSearch(cleanSearch);
  }, [cleanSearch, enabled]);

  const filteredUsers = useMemo(() => {
    if (!enabled || !searchTerm.trim() || cleanSearch.length < 1) {
      return [];
    }

    return searchMentionChatters(
      cleanSearch,
      maxSuggestions,
      mentionLoginRevision,
    ).map(toChatUser);
  }, [cleanSearch, enabled, maxSuggestions, mentionLoginRevision, searchTerm]);

  return {
    filteredUsers,
  };
}
