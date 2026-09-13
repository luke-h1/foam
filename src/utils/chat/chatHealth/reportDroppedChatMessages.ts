import { logger } from '@app/utils/logger';

const REPORT_WINDOW_MS = 30_000;

export type DroppedChatMessagesReason =
  'ingest-buffer-overflow' | 'ingest-rate-limit' | 'delay-queue-overflow';

interface DroppedChatMessagesContext {
  reason: DroppedChatMessagesReason;
  bufferSize?: number;
  maxBufferedMessages?: number;
  limitPerSecond?: number;
}

interface ReportState {
  droppedSinceReport: number;
  lastReportAt: number;
  trailingReportTimer: ReturnType<typeof setTimeout> | null;
  latestContext: DroppedChatMessagesContext | null;
}

const states = new Map<DroppedChatMessagesReason, ReportState>();

const getState = (reason: DroppedChatMessagesReason): ReportState => {
  let state = states.get(reason);
  if (!state) {
    state = {
      droppedSinceReport: 0,
      lastReportAt: 0,
      trailingReportTimer: null,
      latestContext: null,
    };
    states.set(reason, state);
  }
  return state;
};

function flushDroppedChatMessages(
  state: ReportState,
  context: DroppedChatMessagesContext,
): void {
  const { reason, ...details } = context;
  const total = state.droppedSinceReport;
  state.droppedSinceReport = 0;
  state.lastReportAt = Date.now();

  /**
   * A buffer overflow means the pipeline lost rows it meant to show. The rate
   * limit and the delay ceiling drop by design, so they report as warnings.
   */
  if (reason === 'ingest-buffer-overflow') {
    logger.chat.error('chat.pipeline.messages_dropped', {
      name: 'twitch_chat_error',
      fingerprint: ['chat', 'pipeline', 'messages-dropped'],
      tags: { reason },
      droppedMessages: total,
      ...details,
    });
    return;
  }

  logger.chat.warn('chat.pipeline.messages_dropped', {
    name: 'twitch_chat_warning',
    fingerprint: ['chat', 'pipeline', 'messages-dropped', reason],
    tags: { reason },
    droppedMessages: total,
    ...details,
  });
}

export function reportDroppedChatMessages(
  dropped: number,
  context: DroppedChatMessagesContext,
): void {
  if (dropped <= 0) {
    return;
  }

  const state = getState(context.reason);
  state.droppedSinceReport += dropped;
  state.latestContext = context;

  const sinceLastReport = Date.now() - state.lastReportAt;
  if (sinceLastReport < REPORT_WINDOW_MS) {
    /**
     * Waits out the rest of the window and reports whatever built up, so a
     * burst that never repeats still reaches Sentry.
     */
    state.trailingReportTimer ??= setTimeout(() => {
      state.trailingReportTimer = null;
      if (state.droppedSinceReport > 0 && state.latestContext) {
        flushDroppedChatMessages(state, state.latestContext);
      }
    }, REPORT_WINDOW_MS - sinceLastReport);
    return;
  }

  flushDroppedChatMessages(state, context);
}

export function resetDroppedChatMessageReports(): void {
  for (const state of states.values()) {
    if (state.trailingReportTimer) {
      clearTimeout(state.trailingReportTimer);
    }
  }
  states.clear();
}
