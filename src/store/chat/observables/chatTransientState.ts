import { observable } from '@legendapp/state';

/**
 * Per-channel view-local chat state. Session-scoped and never persisted.
 */
export interface ChatTransientChannelState {
  hiddenPhrases: string[];
  hiddenUsers: string[];
  highlightedReplyTargetMessageId: string | null;
  highlightedUsers: string[];
  showOnlyMentions: boolean;
}

export const defaultTransientState: ChatTransientChannelState = {
  hiddenPhrases: [],
  hiddenUsers: [],
  highlightedReplyTargetMessageId: null,
  highlightedUsers: [],
  showOnlyMentions: false,
};

export const chatTransientState$ = observable<
  Partial<Record<string, ChatTransientChannelState>>
>({});
