import { logger } from '@app/utils/logger';

const REPORT_WINDOW_MS = 30_000;

let droppedSinceReport = 0;
let lastReportAt = 0;

export function reportDroppedChatMessages(
  dropped: number,
  context: { bufferSize: number; maxBufferedMessages: number },
): void {
  if (dropped <= 0) {
    return;
  }

  droppedSinceReport += dropped;

  const now = Date.now();
  if (now - lastReportAt < REPORT_WINDOW_MS) {
    return;
  }
  lastReportAt = now;

  const total = droppedSinceReport;
  droppedSinceReport = 0;

  logger.chat.error('chat.pipeline.messages_dropped', {
    name: 'twitch_chat_error',
    fingerprint: ['chat', 'pipeline', 'messages-dropped'],
    tags: { reason: 'ingest-buffer-overflow' },
    droppedMessages: total,
    bufferSize: context.bufferSize,
    maxBufferedMessages: context.maxBufferedMessages,
  });
}

export function resetDroppedChatMessageReports(): void {
  droppedSinceReport = 0;
  lastReportAt = 0;
}
