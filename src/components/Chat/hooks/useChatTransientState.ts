import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import {
  assignTransientState,
  getTransientState,
  resetTransientSearch,
} from '@app/store/chat/actions/transientState';
import { defaultTransientState } from '@app/store/chat/observables/chatTransientState';
import { useTransientChannelFilters } from '@app/store/chat/react/transientSelectors';
import { usePreference } from '@app/store/preferenceStore';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { normaliseChatText } from '@app/utils/chat/normaliseChatText';

/**
 * These are session-only "hide this from my view" lists, not a persisted
 * blocklist, so an old entry is worth dropping rather than growing forever.
 */
const MAX_FILTER_ENTRIES = 50;

export function useChatTransientState(channelId: string) {
  const highlightedReplyTargetTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const {
    hiddenPhrases: transientHiddenPhrases,
    hiddenUsers,
    highlightedUsers,
    searchActive,
    searchQuery,
    showOnlyMentions,
  } = useTransientChannelFilters(channelId);
  const blockedTerms = usePreference('blockedTerms');

  // Stable identity: a fresh array here breaks ChatMessagePane's memo on every
  // render and re-runs the visible-message filter over the whole list.
  const hiddenPhrases = useMemo(
    () => [...transientHiddenPhrases, ...blockedTerms],
    [transientHiddenPhrases, blockedTerms],
  );

  useEffect(
    () => () => {
      resetTransientSearch(channelId);
    },
    [channelId],
  );

  useUnmountCallback(() => {
    if (highlightedReplyTargetTimeoutRef.current) {
      clearTimeout(highlightedReplyTargetTimeoutRef.current);
      highlightedReplyTargetTimeoutRef.current = null;
    }
  });

  const addToFilterList = useCallback(
    (field: 'hiddenUsers' | 'hiddenPhrases', value?: string) => {
      // A hidden user is a login; a hidden phrase is free text and must keep
      // any leading '@'.
      const normalised =
        field === 'hiddenUsers'
          ? normaliseChatUsername(value)
          : normaliseChatText(value);
      if (!normalised) {
        return;
      }

      const current = getTransientState(channelId)[field];
      if (current.includes(normalised)) {
        return;
      }
      assignTransientState(channelId, {
        [field]: [...current, normalised].slice(-MAX_FILTER_ENTRIES),
      });
    },
    [channelId],
  );

  const hideUserFromView = useCallback(
    (username?: string) => {
      addToFilterList('hiddenUsers', username);
    },
    [addToFilterList],
  );

  const hidePhraseFromView = useCallback(
    (phrase?: string) => {
      addToFilterList('hiddenPhrases', phrase);
    },
    [addToFilterList],
  );

  const toggleHighlightedUser = useCallback(
    (username?: string) => {
      const normalised = normaliseChatUsername(username);
      if (!normalised) {
        return;
      }

      const current = getTransientState(channelId).highlightedUsers;
      assignTransientState(channelId, {
        highlightedUsers: current.includes(normalised)
          ? current.filter(entry => entry !== normalised)
          : [...current, normalised].slice(-MAX_FILTER_ENTRIES),
      });
    },
    [channelId],
  );

  const handleClearFilters = useCallback(() => {
    assignTransientState(channelId, defaultTransientState);
  }, [channelId]);

  const handleToggleShowOnlyMentions = useCallback(() => {
    assignTransientState(channelId, {
      showOnlyMentions: !getTransientState(channelId).showOnlyMentions,
    });
  }, [channelId]);

  const closeSearch = useCallback(() => {
    resetTransientSearch(channelId);
  }, [channelId]);

  const handleSearchQueryChange = useCallback(
    (searchQuery: string) => {
      assignTransientState(channelId, { searchQuery });
    },
    [channelId],
  );

  const setHighlightedReplyTargetMessageId = (
    value: string | null | ((current: string | null) => string | null),
  ) => {
    const current =
      getTransientState(channelId).highlightedReplyTargetMessageId;
    assignTransientState(channelId, {
      highlightedReplyTargetMessageId:
        value instanceof Function ? value(current) : value,
    });
  };

  /**
   * Deliberately excludes `blockedTerms`: those are a persisted preference, so
   * counting them would pin the tray open for good and Clear - which only
   * resets transient state - could never dismiss it.
   */
  const hasActiveFilters = Boolean(
    transientHiddenPhrases.length ||
    hiddenUsers.length ||
    highlightedUsers.length ||
    searchActive ||
    searchQuery.length ||
    showOnlyMentions,
  );

  return {
    closeSearch,
    hasActiveFilters,
    handleClearFilters,
    handleSearchQueryChange,
    handleToggleShowOnlyMentions,
    hiddenPhrases,
    hiddenUsers,
    hidePhraseFromView,
    hideUserFromView,
    highlightedReplyTargetTimeoutRef,
    highlightedUsers,
    searchActive,
    searchQuery,
    setHighlightedReplyTargetMessageId,
    showOnlyMentions,
    toggleHighlightedUser,
  };
}
