import { renderHook } from '@testing-library/react-native';
import { useTwitchChat } from '../twitch-chat-service';

const mockPrewarmOnAppStart = jest.fn();

jest.mock(
  'react-native-nitro-websockets',
  () => ({
    prewarmOnAppStart: mockPrewarmOnAppStart,
  }),
  { virtual: true },
);

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: () => ({
    authState: null,
    user: null,
  }),
}));

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

jest.mock('../../hooks/ws/useWebsocket', () => ({
  useWebsocket: jest.fn(() => ({
    getWebSocket: jest.fn(() => ({
      close: jest.fn(),
      readyState: WebSocket.CLOSED,
    })),
    readyState: WebSocket.CLOSED,
    sendJsonMessage: jest.fn(),
    sendMessage: jest.fn(),
  })),
}));

describe('useTwitchChat WebSocket transport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('queues the Twitch IRC socket for Nitro prewarm on next app launch', () => {
    const { rerender } = renderHook(
      ({ channel }: { channel: string }) => useTwitchChat({ channel }),
      {
        initialProps: {
          channel: 'foam',
        },
      },
    );

    rerender({ channel: 'foam' });

    expect(mockPrewarmOnAppStart.mock.calls).toEqual([
      ['wss://irc-ws.chat.twitch.tv:443'],
    ]);
  });
});
