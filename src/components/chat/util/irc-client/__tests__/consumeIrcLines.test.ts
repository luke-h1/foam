import * as chatIngestRateLimiter from '@app/utils/chat/chatIngestRateLimiter';
import type { IrcMessage } from '@app/utils/chat/irc-protocol/parseIrcMessage';

import { consumeIrcLines, type IrcLineHandlers } from '../consumeIrcLines';

function createHandlers() {
  return {
    onDebugLine: jest.fn<void, [string, boolean?]>(),
    onLine: jest.fn<void, [IrcMessage]>(),
    onPing: jest.fn<void, []>(),
  } satisfies IrcLineHandlers;
}

describe('consumeIrcLines', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('routes each complete line and returns the partial tail', () => {
    const handlers = createHandlers();

    const rest = consumeIrcLines(
      ':tmi.twitch.tv 001 viewer :Welcome\r\n:tmi.twitch.tv 002 vie',
      handlers,
    );

    expect(rest).toEqual(':tmi.twitch.tv 002 vie');

    expect(handlers.onLine.mock.calls).toEqual([
      [
        {
          command: '001',
          params: ['viewer', 'Welcome'],
          prefix: 'tmi.twitch.tv',
        },
      ],
    ]);

    expect(handlers.onDebugLine.mock.calls).toEqual([
      [':tmi.twitch.tv 001 viewer :Welcome'],
    ]);
  });

  test('answers a PING without parsing or logging it', () => {
    const handlers = createHandlers();

    expect(consumeIrcLines('PING :tmi.twitch.tv\r\n', handlers)).toEqual('');

    expect(handlers.onPing).toHaveBeenCalledTimes(1);

    expect(handlers.onLine).not.toHaveBeenCalled();

    expect(handlers.onDebugLine).not.toHaveBeenCalled();
  });

  test('skips empty lines', () => {
    const handlers = createHandlers();

    expect(consumeIrcLines('\r\n\r\n', handlers)).toEqual('');

    expect(handlers.onDebugLine).not.toHaveBeenCalled();
  });

  test('logs a rate-limited PRIVMSG as dropped and does not route it', () => {
    jest
      .spyOn(chatIngestRateLimiter, 'shouldProcessLiveMessage')
      .mockReturnValue(false);

    const handlers = createHandlers();
    const line = ':viewer!viewer@viewer.tmi.twitch.tv PRIVMSG #channel :hi';

    consumeIrcLines(`${line}\r\n`, handlers);

    expect(handlers.onDebugLine.mock.calls).toEqual([[line, true]]);

    expect(handlers.onLine).not.toHaveBeenCalled();
  });
});
