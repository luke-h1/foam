import { useDeferredValue, useEffect, useMemo } from 'react';

import { useSelector } from '@legendapp/state/react';

import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { ChatUser } from '@app/store/chat/types/constants';
import { queueMentionLoginSearch } from '@app/utils/chat/mentionLoginResolver/queueMentionLoginSearch';
import { normaliseChatText } from '@app/utils/chat/normaliseChatText';
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
  const cleanSearch = normaliseChatText(searchTerm.slice(1));
  /**
   * The search scans both mention indexes, so it trails the keystroke rather
   * than sharing a frame with the character the composer is echoing.
   */
  const deferredSearch = useDeferredValue(cleanSearch);
  /**
   * Deferring delays the search, not the clear - the deferred value still holds
   * the previous mention for a render after the query empties.
   */
  const hasSearch = cleanSearch.length > 0;

  useEffect(() => {
    if (!enabled || cleanSearch.length < 2) {
      return;
    }

    queueMentionLoginSearch(cleanSearch);
  }, [cleanSearch, enabled]);

  const filteredUsers = useMemo(() => {
    if (!enabled || !hasSearch || deferredSearch.length < 1) {
      return [];
    }

    return searchMentionChatters(
      deferredSearch,
      maxSuggestions,
      mentionLoginRevision,
    ).map(toChatUser);
  }, [
    deferredSearch,
    enabled,
    hasSearch,
    maxSuggestions,
    mentionLoginRevision,
  ]);

  return {
    filteredUsers,
  };
}
