import {
  type ChatTransientChannelState,
  chatTransientState$,
  defaultTransientState,
} from '../observables/chatTransientState';
import type { ParsedRoomState } from '../types/roomState';

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

export function setChannelRoomState(
  channelId: string,
  roomState: ParsedRoomState | null,
): void {
  assignTransientState(channelId, { roomState });
}
