import type { ChatFontScale } from '@app/components/chat/components/chat-message/util/chat-scale';
import type { ChatRowLiveState } from '@app/store/chat/react/use-chat-row-live-state';
import type { CustomHighlight } from '@app/store/preference-store';
import type { MessageToken } from '@app/utils/chat/message-token';

/**
 * Everything outside the message that changes how a row looks. A new context
 * object rebuilds every row, so the caller keeps it referentially stable.
 */
export interface NativeChatRowContext {
  animate: boolean;
  channelId: string;
  compact: boolean;
  currentUsernameNormalized: string;
  customHighlights: CustomHighlight[] | undefined;
  disableEmoteAnimations: boolean;
  fontScale: ChatFontScale | undefined;
  getMentionColor: (username: string) => string;
  highlightedUserSet: ReadonlySet<string>;
  paintsEnabled: boolean;
  parseTextForEmotes: (text: string) => MessageToken[];
  sharedChatEnabled: boolean;
  showAlternatingChatRows: boolean;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
}

/**
 * Store values that change after a message arrives. The native list checks
 * them when it rebuilds rows.
 */
export type NativeChatRowLiveState = Omit<
  ChatRowLiveState,
  'cosmeticsRevision'
>;

/**
 * Collected while one row builds: which live values the row read, so a later
 * change to a value the row did not read keeps the cached row.
 */
export interface NativeRowBuildState {
  context: NativeChatRowContext;

  /**
   * Each coloured mention and the colour it drew in. A mention login
   * revision only rebuilds the row when one of these colours changed.
   */
  mentions: { color: string; username: string }[];
  usesRewardTitle: boolean;
}
