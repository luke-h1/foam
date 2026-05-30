import { observable } from '@legendapp/state';
import { useSelector } from '@legendapp/state/react';
import { useCallback, useEffect, useRef } from 'react';

import type { AnyChatMessageType } from '../util/messageHandlers';

interface ChatTransientChannelState {
  hiddenPhrases: string[];
  hiddenUsers: string[];
  highlightedReplyTargetMessageId?: string;
  highlightedUsers: string[];
  showOnlyMentions: boolean;
}

const defaultTransientState: ChatTransientChannelState = {
  hiddenPhrases: [],
  hiddenUsers: [],
  highlightedUsers: [],
  showOnlyMentions: false,
};

const chatTransientState$ = observable<
  Record<string, ChatTransientChannelState | undefined>
>({});

function getTransientState(channelId: string): ChatTransientChannelState {
  return chatTransientState$[channelId]!.peek() ?? defaultTransientState;
}

function assignTransientState(
  channelId: string,
  patch: Partial<ChatTransientChannelState>,
) {
  chatTransientState$[channelId]!.set({
    ...getTransientState(channelId),
    ...patch,
  });
}

export function useChatTransientState(channelId: string) {
  const visiblePersonalEmoteUsersRef = useRef<Set<string>>(new Set());
  const visibleCosmeticUsersRef = useRef<Set<string>>(new Set());
  const hydratedVisibleAssetKeysRef = useRef<Set<string>>(new Set());
  const pendingVisibleMessagesRef = useRef<AnyChatMessageType[]>([]);
  const visibleAssetHydrationTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const highlightedReplyTargetTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const state = useSelector(
    () => chatTransientState$[channelId]!.get() ?? defaultTransientState,
  ) as ChatTransientChannelState;

  useEffect(() => {
    return () => {
      if (highlightedReplyTargetTimeoutRef.current) {
        clearTimeout(highlightedReplyTargetTimeoutRef.current);
        highlightedReplyTargetTimeoutRef.current = null;
      }
      if (visibleAssetHydrationTimerRef.current) {
        clearTimeout(visibleAssetHydrationTimerRef.current);
        visibleAssetHydrationTimerRef.current = null;
      }
    };
  }, []);

  const hideUserFromView = useCallback(
    (username?: string) => {
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
    },
    [channelId],
  );

  const toggleHighlightedUser = useCallback(
    (username?: string) => {
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
    },
    [channelId],
  );

  const hidePhraseFromView = useCallback(
    (phrase?: string) => {
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

  const setHighlightedReplyTargetMessageId = useCallback(
    (
      value:
        | string
        | undefined
        | ((current: string | undefined) => string | undefined),
    ) => {
      const current =
        getTransientState(channelId).highlightedReplyTargetMessageId;
      assignTransientState(channelId, {
        highlightedReplyTargetMessageId:
          typeof value === 'function' ? value(current) : value,
      });
    },
    [channelId],
  );

  return {
    handleClearFilters,
    handleToggleShowOnlyMentions,
    hiddenPhrases: state.hiddenPhrases,
    hiddenUsers: state.hiddenUsers,
    hidePhraseFromView,
    hideUserFromView,
    highlightedReplyTargetMessageId: state.highlightedReplyTargetMessageId,
    highlightedReplyTargetTimeoutRef,
    highlightedUsers: state.highlightedUsers,
    hydratedVisibleAssetKeysRef,
    pendingVisibleMessagesRef,
    setHighlightedReplyTargetMessageId,
    showOnlyMentions: state.showOnlyMentions,
    toggleHighlightedUser,
    visibleAssetHydrationTimerRef,
    visibleCosmeticUsersRef,
    visiblePersonalEmoteUsersRef,
  };
}
