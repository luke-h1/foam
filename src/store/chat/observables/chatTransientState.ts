import { observable } from '@legendapp/state';

/**
 * Per-channel view-local chat state (hide/highlight filters, the flash-target
 * of a reply jump). Session-scoped and never persisted: it resets with the app,
 * not with the channel cache.
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
