import type { ChatRowRenderProps } from '../ChatRow.types';

/**
 * Every render prop a row takes beside the message fields. `satisfies` fails
 * the build when `ChatRowRenderProps` gains or loses a key, so the list cannot
 * drift.
 */
export const CHAT_ROW_RENDER_PROP_KEYS = {
  broadcasterId: true,
  currentUsername: true,
  currentUsernameNormalized: true,
  customHighlights: true,
  density: true,
  fontScale: true,
  getMentionColor: true,
  highlightedUserSet: true,
  messageDisplay: true,
  onBadgePress: true,
  onMessageLongPress: true,
  onReplyContextPress: true,
  onUsernamePress: true,
  parseTextForEmotes: true,
  style: true,
} as const satisfies Record<keyof ChatRowRenderProps<'usernotice'>, true>;
