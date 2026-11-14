import {
  type ChatTransientChannelState,
  chatTransientState$,
  defaultTransientState,
} from '../observables/chat-transient-state';

export function getTransientState(
  channelId: string,
): ChatTransientChannelState {
  return chatTransientState$[channelId]!.peek() ?? defaultTransientState;
}

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
