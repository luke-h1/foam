import { useDeferredValue, useEffect, useMemo } from 'react';

import { useSelector } from '@legendapp/state/react';

import { queueMentionLoginSearch } from '@app/store/chat/actions/mention-login-lookup';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { ChatUser } from '@app/types/chat/chatMessage';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { searchMentionChatters } from '@app/utils/chat/resolve-mention-login/searchMentionChatters';
import { type MentionChatter } from '@app/utils/chat/resolve-mention-login/types';

interface UseUserSuggestionsOptions {
  searchTerm: string;
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
  maxSuggestions = 50,
}: UseUserSuggestionsOptions) {
  const mentionLoginRevision = useSelector(chatStore$.mentionLoginRevision);
  const cleanSearch = normaliseChatUsername(searchTerm);

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
    if (cleanSearch.length < 2) {
      return;
    }

    queueMentionLoginSearch(cleanSearch);
  }, [cleanSearch]);

  const filteredUsers = useMemo(() => {
    if (!hasSearch || deferredSearch.length < 1) {
      return [];
    }

    return searchMentionChatters(deferredSearch, maxSuggestions).map(
      toChatUser,
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the mention indexes are plain Maps, so the revision is the only signal that they changed
  }, [deferredSearch, hasSearch, maxSuggestions, mentionLoginRevision]);

  return {
    filteredUsers,
  };
}
