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

function useTransientChannelField<K extends keyof typeof defaultTransientState>(
  channelId: string,
  field: K,
): (typeof defaultTransientState)[K] {
  return useSelector(() => {
    // Indexing with a generic key widens get() to the union of field types.
    const value = chatTransientState$[channelId]![field].get() as
      (typeof defaultTransientState)[K] | undefined;
    return value ?? defaultTransientState[field];
  });
}

/**
 * Field-granular subscriptions so a change to one filter only re-renders
 * consumers of that field.
 */
export function useTransientChannelFilters(channelId: string) {
  const hiddenPhrases = useTransientChannelField(channelId, 'hiddenPhrases');
  const hiddenUsers = useTransientChannelField(channelId, 'hiddenUsers');
  const highlightedUsers = useTransientChannelField(
    channelId,
    'highlightedUsers',
  );
  const showOnlyMentions = useTransientChannelField(
    channelId,
    'showOnlyMentions',
  );
  return { hiddenPhrases, hiddenUsers, highlightedUsers, showOnlyMentions };
}

/**
 * Latest ROOMSTATE-derived chat modes for a channel, or null before the first
 * ROOMSTATE arrives.
 */
export function useChannelRoomState(channelId: string) {
  return useTransientChannelField(channelId, 'roomState');
}
