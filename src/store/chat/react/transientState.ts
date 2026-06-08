import { useLazyRef } from '@app/hooks/useLazyRef';
import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import { useSelector } from '@legendapp/state/react';
import { useRef } from 'react';

import type { AnyChatMessageType } from '../types/constants';
import {
  assignTransientChannelState,
  chatTransientState$,
  defaultTransientChannelState,
  getTransientChannelState,
} from '../observables/transientChannelState';

export function useIsHighlightedReplyTargetMessage(
  channelId: string,
  messageId: string,
) {
  return useSelector(
    () =>
      (chatTransientState$[channelId]!.highlightedReplyTargetMessageId.get() ??
        null) === messageId,
  );
}

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

  const hiddenPhrases = useSelector(
    () =>
      chatTransientState$[channelId]!.hiddenPhrases.get() ??
      defaultTransientChannelState.hiddenPhrases,
  );

  const hiddenUsers = useSelector(
    () =>
      chatTransientState$[channelId]!.hiddenUsers.get() ??
      defaultTransientChannelState.hiddenUsers,
  );

  const highlightedUsers = useSelector(
    () =>
      chatTransientState$[channelId]!.highlightedUsers.get() ??
      defaultTransientChannelState.highlightedUsers,
  );

  const showOnlyMentions = useSelector(
    () =>
      chatTransientState$[channelId]!.showOnlyMentions.get() ??
      defaultTransientChannelState.showOnlyMentions,
  );

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
    const channelHiddenUsers = getTransientChannelState(channelId).hiddenUsers;
    if (channelHiddenUsers.includes(normalised)) {
      return;
    }
    assignTransientChannelState(channelId, {
      hiddenUsers: [...channelHiddenUsers, normalised].slice(-50),
    });
  };

  const toggleHighlightedUser = (username?: string) => {
    if (!username) {
      return;
    }

    const normalised = username.trim().toLowerCase();
    const channelHighlightedUsers =
      getTransientChannelState(channelId).highlightedUsers;
    assignTransientChannelState(channelId, {
      highlightedUsers: channelHighlightedUsers.includes(normalised)
        ? channelHighlightedUsers.filter(entry => entry !== normalised)
        : [...channelHighlightedUsers, normalised].slice(-50),
    });
  };

  const hidePhraseFromView = (phrase?: string) => {
    if (!phrase?.trim()) {
      return;
    }

    const normalised = phrase.trim().toLowerCase();
    const channelHiddenPhrases =
      getTransientChannelState(channelId).hiddenPhrases;
    if (channelHiddenPhrases.includes(normalised)) {
      return;
    }
    assignTransientChannelState(channelId, {
      hiddenPhrases: [...channelHiddenPhrases, normalised].slice(-50),
    });
  };

  const handleClearFilters = () => {
    assignTransientChannelState(channelId, defaultTransientChannelState);
  };

  const handleToggleShowOnlyMentions = () => {
    assignTransientChannelState(channelId, {
      showOnlyMentions: !getTransientChannelState(channelId).showOnlyMentions,
    });
  };

  const setHighlightedReplyTargetMessageId = (
    value: string | null | ((current: string | null) => string | null),
  ) => {
    const current =
      getTransientChannelState(channelId).highlightedReplyTargetMessageId;
    assignTransientChannelState(channelId, {
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
