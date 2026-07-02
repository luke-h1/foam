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
    // Indexing the observable with a generic key widens get() to the union of
    // all field types, so narrow it back to the selected field's type.
    const value = chatTransientState$[channelId]![field].get() as
      (typeof defaultTransientState)[K] | undefined;
    return value ?? defaultTransientState[field];
  });
}

/**
 * Field-granular subscriptions so a change to one filter (e.g. hiding a user)
 * only re-renders consumers of that field, not everything reading the channel's
 * transient state.
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
