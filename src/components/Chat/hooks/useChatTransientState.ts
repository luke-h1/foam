import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useLazyRef } from '@app/hooks/useLazyRef';
import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import {
  assignTransientState,
  getTransientState,
} from '@app/store/chat/actions/transientState';
import { defaultTransientState } from '@app/store/chat/observables/chatTransientState';
import { useTransientChannelFilters } from '@app/store/chat/react/transientSelectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { usePreference } from '@app/store/preferences/selectors';

export function useChatTransientState(channelId: string) {
  const visiblePersonalEmoteUsersRef = useLazyRef(() => new Set<string>());
  const visibleCosmeticUsersRef = useLazyRef(() => new Set<string>());
  const hydratedVisibleAssetKeysRef = useLazyRef(() => new Set<string>());
  const pendingVisibleMessagesRef = useRef<AnyChatMessageType[]>([]);
  const visibleAssetHydrationTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const highlightedReplyTargetTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const {
    hiddenPhrases: transientHiddenPhrases,
    hiddenUsers,
    highlightedUsers,
    showOnlyMentions,
  } = useTransientChannelFilters(channelId);
  const blockedTerms = usePreference('blockedTerms');

  // Stable identity: a fresh array here breaks ChatMessagePane's memo on every
  // render and re-runs the visible-message filter over the whole list.
  const hiddenPhrases = useMemo(
    () => [...transientHiddenPhrases, ...blockedTerms],
    [transientHiddenPhrases, blockedTerms],
  );

  /**
   * The visible-asset dedup guards persist across channel switches (the refs are
   * created once), so reset them when the channel changes - a new channel's
   * messages/chatters shouldn't inherit the previous channel's hydration keys,
   * and clearing keeps them from carrying stale entries between sessions.
   */
  useEffect(() => {
    const personalEmoteUsers = visiblePersonalEmoteUsersRef.current;
    const cosmeticUsers = visibleCosmeticUsersRef.current;
    const hydratedKeys = hydratedVisibleAssetKeysRef.current;
    return () => {
      personalEmoteUsers.clear();
      cosmeticUsers.clear();
      hydratedKeys.clear();
    };
  }, [
    channelId,
    hydratedVisibleAssetKeysRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  ]);

  useUnmountCallback(() => {
    const highlightedReplyTimeout = highlightedReplyTargetTimeoutRef.current;
    const visibleAssetTimer = visibleAssetHydrationTimerRef.current;

    if (highlightedReplyTimeout) {
      clearTimeout(highlightedReplyTimeout);
      highlightedReplyTargetTimeoutRef.current = null;
    }
    if (visibleAssetTimer) {
      clearTimeout(visibleAssetTimer);
      visibleAssetHydrationTimerRef.current = null;
    }
  });

  const hideUserFromView = (username?: string) => {
    if (!username) {
      return;
    }

    const normalised = username.trim().toLowerCase();
    const hiddenUsers = getTransientState(channelId).hiddenUsers;
    if (hiddenUsers.includes(normalised)) {
      return;
    }
    assignTransientState(channelId, {
      hiddenUsers: [...hiddenUsers, normalised].slice(-50),
    });
  };

  const toggleHighlightedUser = (username?: string) => {
    if (!username) {
      return;
    }

    const normalised = username.trim().toLowerCase();
    const highlightedUsers = getTransientState(channelId).highlightedUsers;
    assignTransientState(channelId, {
      highlightedUsers: highlightedUsers.includes(normalised)
        ? highlightedUsers.filter(entry => entry !== normalised)
        : [...highlightedUsers, normalised].slice(-50),
    });
  };

  const hidePhraseFromView = (phrase?: string) => {
    if (!phrase?.trim()) {
      return;
    }

    const normalised = phrase.trim().toLowerCase();
    const hiddenPhrases = getTransientState(channelId).hiddenPhrases;
    if (hiddenPhrases.includes(normalised)) {
      return;
    }
    assignTransientState(channelId, {
      hiddenPhrases: [...hiddenPhrases, normalised].slice(-50),
    });
  };

  const handleClearFilters = useCallback(() => {
    assignTransientState(channelId, defaultTransientState);
  }, [channelId]);

  const handleToggleShowOnlyMentions = useCallback(() => {
    assignTransientState(channelId, {
      showOnlyMentions: !getTransientState(channelId).showOnlyMentions,
    });
  }, [channelId]);

  const setHighlightedReplyTargetMessageId = (
    value: string | null | ((current: string | null) => string | null),
  ) => {
    const current =
      getTransientState(channelId).highlightedReplyTargetMessageId;
    assignTransientState(channelId, {
      highlightedReplyTargetMessageId:
        typeof value === 'function' ? value(current) : value,
    });
  };

  return {
    handleClearFilters,
    handleToggleShowOnlyMentions,
    hiddenPhrases,
    hiddenUsers,
    hidePhraseFromView,
    hideUserFromView,
    highlightedReplyTargetTimeoutRef,
    highlightedUsers,
    hydratedVisibleAssetKeysRef,
    pendingVisibleMessagesRef,
    setHighlightedReplyTargetMessageId,
    showOnlyMentions,
    toggleHighlightedUser,
    visibleAssetHydrationTimerRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  };
}
