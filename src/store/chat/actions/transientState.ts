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

export function assignTransientState(
  channelId: string,
  patch: Partial<ChatTransientChannelState>,
): void {
  chatTransientState$[channelId]!.set({
    ...getTransientState(channelId),
    ...patch,
  });
}
