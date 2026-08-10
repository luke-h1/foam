import { logger } from '@app/utils/logger';

const REPORT_WINDOW_MS = 30_000;

interface DroppedChatMessagesContext {
  bufferSize: number;
  maxBufferedMessages: number;
}

let droppedSinceReport = 0;
let lastReportAt = 0;
let trailingReportTimer: ReturnType<typeof setTimeout> | null = null;
let latestContext: DroppedChatMessagesContext | null = null;

function flushDroppedChatMessages(context: DroppedChatMessagesContext): void {
  const total = droppedSinceReport;
  droppedSinceReport = 0;
  lastReportAt = Date.now();

  logger.chat.error('chat.pipeline.messages_dropped', {
    name: 'twitch_chat_error',
    fingerprint: ['chat', 'pipeline', 'messages-dropped'],
    tags: { reason: 'ingest-buffer-overflow' },
    droppedMessages: total,
    bufferSize: context.bufferSize,
    maxBufferedMessages: context.maxBufferedMessages,
  });
}

export function reportDroppedChatMessages(
  dropped: number,
  context: DroppedChatMessagesContext,
): void {
  if (dropped <= 0) {
    return;
  }

  droppedSinceReport += dropped;
  latestContext = context;

  const sinceLastReport = Date.now() - lastReportAt;
  if (sinceLastReport < REPORT_WINDOW_MS) {
    /**
     * Waits out the rest of the window and reports whatever built up, so a
     * burst that never repeats still reaches Sentry.
     */
    trailingReportTimer ??= setTimeout(() => {
      trailingReportTimer = null;
      if (droppedSinceReport > 0 && latestContext) {
        flushDroppedChatMessages(latestContext);
      }
    }, REPORT_WINDOW_MS - sinceLastReport);
    return;
  }

  flushDroppedChatMessages(context);
}

export function resetDroppedChatMessageReports(): void {
  if (trailingReportTimer) {
    clearTimeout(trailingReportTimer);
    trailingReportTimer = null;
  }
  droppedSinceReport = 0;
  lastReportAt = 0;
  latestContext = null;
}
