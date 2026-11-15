import type { AnyChatMessageType } from '@app/types/chat/chatMessage';

const FRESH_COMMIT_WINDOW_MS = 1000;

export function shouldAnimateMessageEntrance(
  message: AnyChatMessageType,
  now: number,
): boolean {
  if (message.isHistorical || message.arrivedInBurst) {
    return false;
  }

  return (
    message.committedAt !== undefined &&
    now - message.committedAt < FRESH_COMMIT_WINDOW_MS
  );
}
