import { observable } from '@legendapp/state';

export interface ChatTransientChannelState {
  hiddenPhrases: string[];
  hiddenUsers: string[];
  highlightedReplyTargetMessageId: string | null;
  highlightedUsers: string[];
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
