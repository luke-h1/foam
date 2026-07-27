import { observable } from '@legendapp/state';

/**
 * Per-channel view-local chat state. Session-scoped and never persisted.
 */
export interface ChatTransientChannelState {
  hiddenPhrases: string[];
  hiddenUsers: string[];
  highlightedReplyTargetMessageId: string | null;
  highlightedUsers: string[];
  /**
   * Whether the search tray is open. Distinct from a non-empty query so the
   * field stays visible while the user is still typing or has cleared it.
   */
  searchActive: boolean;
  searchQuery: string;
  showOnlyMentions: boolean;
}

export const defaultTransientState: ChatTransientChannelState = {
  hiddenPhrases: [],
  hiddenUsers: [],
  highlightedReplyTargetMessageId: null,
  highlightedUsers: [],
  searchActive: false,
  searchQuery: '',
  showOnlyMentions: false,
};

export const chatTransientState$ = observable<
  Partial<Record<string, ChatTransientChannelState>>
>({});
