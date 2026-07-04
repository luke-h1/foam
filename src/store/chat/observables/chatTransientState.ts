import { observable } from '@legendapp/state';

import type { ParsedRoomState } from '../types/roomState';

/**
 * Per-channel view-local chat state. Session-scoped and never persisted.
 */
export interface ChatTransientChannelState {
  hiddenPhrases: string[];
  hiddenUsers: string[];
  highlightedReplyTargetMessageId: string | null;
  highlightedUsers: string[];
  roomState: ParsedRoomState | null;
  showOnlyMentions: boolean;
}

export const defaultTransientState: ChatTransientChannelState = {
  hiddenPhrases: [],
  hiddenUsers: [],
  highlightedReplyTargetMessageId: null,
  highlightedUsers: [],
  roomState: null,
  showOnlyMentions: false,
};

export const chatTransientState$ = observable<
  Partial<Record<string, ChatTransientChannelState>>
>({});
