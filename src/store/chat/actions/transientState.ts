import {
  type ChatTransientChannelState,
  chatTransientState$,
  defaultTransientState,
} from '../observables/chatTransientState';

export function getTransientState(
  channelId: string,
): ChatTransientChannelState {
  return chatTransientState$[channelId]!.peek() ?? defaultTransientState;
}

/**
 * Search is a momentary view; without this, returning to a channel restores a
 * filtered list with no visible cause.
 */
export function resetTransientSearch(channelId: string): void {
  assignTransientState(channelId, { searchActive: false, searchQuery: '' });
}

export function assignTransientState(
  channelId: string,
  patch: Partial<ChatTransientChannelState>,
): void {
  chatTransientState$[channelId]!.set({
    ...getTransientState(channelId),
    ...patch,
  });
}
