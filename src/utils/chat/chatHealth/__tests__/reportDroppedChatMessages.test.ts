import { logger } from '@app/utils/logger';

import {
  reportDroppedChatMessages,
  resetDroppedChatMessageReports,
} from '../reportDroppedChatMessages';

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const mockError = jest.mocked(logger.chat.error);
const context = { bufferSize: 600, maxBufferedMessages: 600 };

describe('reportDroppedChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-09T20:00:00Z'));
    resetDroppedChatMessageReports();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  test('accumulates further drops into the next windowed report', () => {
    reportDroppedChatMessages(4, context);
    reportDroppedChatMessages(6, context);
    reportDroppedChatMessages(10, context);

    expect(mockError).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(30_000);
    reportDroppedChatMessages(1, context);

    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError).toHaveBeenLastCalledWith(
      'chat.pipeline.messages_dropped',
      {
        name: 'twitch_chat_error',
        fingerprint: ['chat', 'pipeline', 'messages-dropped'],
        tags: { reason: 'ingest-buffer-overflow' },
        droppedMessages: 17,
        bufferSize: 600,
        maxBufferedMessages: 600,
      },
    );
  });
});
