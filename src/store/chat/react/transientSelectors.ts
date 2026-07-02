import { useSelector } from '@legendapp/state/react';

import {
  chatTransientState$,
  defaultTransientState,
} from '../observables/chatTransientState';

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

/**
 * Field-granular subscriptions so a change to one filter (e.g. hiding a user)
 * only re-renders consumers of that field, not everything reading the channel's
 * transient state.
 */
export function useTransientChannelFilters(channelId: string) {
  const hiddenPhrases = useSelector(
    () =>
      chatTransientState$[channelId]!.hiddenPhrases.get() ??
      defaultTransientState.hiddenPhrases,
  );
  const hiddenUsers = useSelector(
    () =>
      chatTransientState$[channelId]!.hiddenUsers.get() ??
      defaultTransientState.hiddenUsers,
  );
  const highlightedUsers = useSelector(
    () =>
      chatTransientState$[channelId]!.highlightedUsers.get() ??
      defaultTransientState.highlightedUsers,
  );
  const showOnlyMentions = useSelector(
    () =>
      chatTransientState$[channelId]!.showOnlyMentions.get() ??
      defaultTransientState.showOnlyMentions,
  );
  return { hiddenPhrases, hiddenUsers, highlightedUsers, showOnlyMentions };
}
