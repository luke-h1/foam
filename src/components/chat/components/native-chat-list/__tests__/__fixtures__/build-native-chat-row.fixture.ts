import type {
  NativeChatRowContext,
  NativeChatRowLiveState,
} from '@app/components/chat/components/native-chat-list/util/native-row-context';

export function createNativeRowContext(
  overrides: Partial<NativeChatRowContext> = {},
): NativeChatRowContext {
  return {
    animate: false,
    channelId: 'channel-id',
    compact: false,
    currentUsernameNormalized: 'viewer',
    customHighlights: undefined,
    disableEmoteAnimations: false,
    fontScale: undefined,
    getMentionColor: () => '#00ff00',
    highlightedUserSet: new Set(),
    paintsEnabled: true,
    parseTextForEmotes: text => [{ type: 'text', content: text }],
    sharedChatEnabled: false,
    showAlternatingChatRows: false,
    showInlineReplyContext: true,
    showTimestamps: false,
    ...overrides,
  };
}

export function createNativeRowLiveState(
  overrides: Partial<NativeChatRowLiveState> = {},
): NativeChatRowLiveState {
  return {
    highlightedReplyTargetId: null,
    mentionLoginRevision: 0,
    paints: {},
    rewardTitleRevision: 0,
    userPaintIds: {},
    ...overrides,
  };
}
