import { logger } from '@app/utils/logger';

import {
  reportUnrenderableNotice,
  resetUnrenderableNoticeReports,
} from '../reportUnrenderableNotice';

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

describe('reportUnrenderableNotice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetUnrenderableNoticeReports();
  });

  test('reports the notice shape it could not draw', () => {
    reportUnrenderableNotice({
      msgId: 'midnightsquid',
      reason: 'no-body',
      stage: 'ingest',
      systemMsg: 'something new',
    });

    expect(mockError).toHaveBeenCalledWith('chat.notice.unrenderable', {
      name: 'twitch_chat_error',
      fingerprint: [
        'chat',
        'notice',
        'unrenderable',
        'midnightsquid',
        'no-body',
      ],
      tags: {
        msgId: 'midnightsquid',
        noticeStage: 'ingest',
        reason: 'no-body',
      },
      systemMsg: 'something new',
    });
  });

  test('reports one notice shape once, however often chat repeats it', () => {
    for (let i = 0; i < 50; i += 1) {
      reportUnrenderableNotice({
        msgId: 'midnightsquid',
        reason: 'no-body',
        stage: 'ingest',
      });
    }

    expect(mockError).toHaveBeenCalledTimes(1);
  });

  test('separates stages, msg-ids and reasons', () => {
    reportUnrenderableNotice({
      msgId: 'a',
      reason: 'no-body',
      stage: 'ingest',
    });
    reportUnrenderableNotice({
      msgId: 'a',
      reason: 'no-body',
      stage: 'render',
    });
    reportUnrenderableNotice({
      msgId: 'b',
      reason: 'no-body',
      stage: 'ingest',
    });
    reportUnrenderableNotice({ msgId: 'a', reason: 'empty', stage: 'ingest' });

    expect(mockError).toHaveBeenCalledTimes(4);
  });

  test('falls back to an unknown msg-id', () => {
    reportUnrenderableNotice({ reason: 'no-body', stage: 'ingest' });

    expect(mockError).toHaveBeenCalledWith('chat.notice.unrenderable', {
      name: 'twitch_chat_error',
      fingerprint: ['chat', 'notice', 'unrenderable', 'unknown', 'no-body'],
      tags: { msgId: 'unknown', noticeStage: 'ingest', reason: 'no-body' },
      systemMsg: undefined,
    });
  });
});
