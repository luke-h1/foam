import { logger } from '@app/utils/logger';

import {
  reportDroppedChatMessages,
  resetDroppedChatMessageReports,
} from '../reportDroppedChatMessages';

const context = {
  reason: 'ingest-buffer-overflow' as const,
  bufferSize: 600,
  maxBufferedMessages: 600,
};

describe('reportDroppedChatMessages', () => {
  let mockError: jest.SpiedFunction<typeof logger.chat.error>;

  beforeEach(() => {
    mockError = jest.spyOn(logger.chat, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-09T20:00:00Z'));
    resetDroppedChatMessageReports();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('reports how many messages the pipeline lost', () => {
    reportDroppedChatMessages(4, context);

    expect(mockError).toHaveBeenCalledWith('chat.pipeline.messages_dropped', {
      name: 'twitch_chat_error',
      fingerprint: ['chat', 'pipeline', 'messages-dropped'],
      tags: { reason: 'ingest-buffer-overflow' },
      droppedMessages: 4,
      bufferSize: 600,
      maxBufferedMessages: 600,
    });
  });

  test('ignores a report of nothing dropped', () => {
    reportDroppedChatMessages(0, context);

    expect(mockError).not.toHaveBeenCalled();
  });

  test('accumulates further drops into one report at the end of the window', () => {
    reportDroppedChatMessages(4, context);
    reportDroppedChatMessages(6, context);
    reportDroppedChatMessages(10, context);

    expect(mockError).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(30_000);

    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError).toHaveBeenLastCalledWith(
      'chat.pipeline.messages_dropped',
      {
        name: 'twitch_chat_error',
        fingerprint: ['chat', 'pipeline', 'messages-dropped'],
        tags: { reason: 'ingest-buffer-overflow' },
        droppedMessages: 16,
        bufferSize: 600,
        maxBufferedMessages: 600,
      },
    );
  });

  test('stays quiet when the window passes with nothing else dropped', () => {
    reportDroppedChatMessages(4, context);

    jest.advanceTimersByTime(120_000);

    expect(mockError).toHaveBeenCalledTimes(1);
  });

  test('reports by-design drops as warnings under their own fingerprint', () => {
    const mockWarn = jest
      .spyOn(logger.chat, 'warn')
      .mockImplementation(() => {});

    reportDroppedChatMessages(3, {
      reason: 'ingest-rate-limit',
      limitPerSecond: 150,
    });

    expect(mockError).not.toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalledWith('chat.pipeline.messages_dropped', {
      name: 'twitch_chat_warning',
      fingerprint: [
        'chat',
        'pipeline',
        'messages-dropped',
        'ingest-rate-limit',
      ],
      tags: { reason: 'ingest-rate-limit' },
      droppedMessages: 3,
      limitPerSecond: 150,
    });
  });

  test('abandons the pending report when the session is reset', () => {
    reportDroppedChatMessages(4, context);
    reportDroppedChatMessages(6, context);

    resetDroppedChatMessageReports();
    jest.advanceTimersByTime(30_000);

    expect(mockError).toHaveBeenCalledTimes(1);
  });
});
