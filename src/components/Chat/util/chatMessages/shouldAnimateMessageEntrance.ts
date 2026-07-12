import type { AnyChatMessageType } from '@app/store/chat/types/constants';

/**
 * Rows mount in the same frame as their store commit when they arrive live;
 * anything older at mount time is scrollback re-entering the draw window.
 */
const FRESH_COMMIT_WINDOW_MS = 1000;

export function shouldAnimateMessageEntrance(
  message: AnyChatMessageType,
  now: number,
): boolean {
  if (message.isHistorical) {
    return false;
  }

  return (
    message.committedAt !== undefined &&
    now - message.committedAt < FRESH_COMMIT_WINDOW_MS
  );
}
