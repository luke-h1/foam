import { observable } from '@legendapp/state';

export interface ChatTransientChannelState {
  hiddenPhrases: string[];
  hiddenUsers: string[];
  highlightedReplyTargetMessageId: string | null;
  highlightedUsers: string[];
  showOnlyMentions: boolean;
}

export const defaultTransientChannelState: ChatTransientChannelState = {
  hiddenPhrases: [],
  hiddenUsers: [],
  highlightedReplyTargetMessageId: null,
  highlightedUsers: [],
  showOnlyMentions: false,
};

export const chatTransientState$ = observable<
  Partial<Record<string, ChatTransientChannelState>>
>({});

export function getTransientChannelState(
  channelId: string,
): ChatTransientChannelState {
  return chatTransientState$[channelId]!.peek() ?? defaultTransientChannelState;
}

export function assignTransientChannelState(
  channelId: string,
  patch: Partial<ChatTransientChannelState>,
) {
  chatTransientState$[channelId]!.set({
    ...getTransientChannelState(channelId),
    ...patch,
  });
}
