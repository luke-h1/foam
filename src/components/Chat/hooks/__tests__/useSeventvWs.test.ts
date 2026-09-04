import { act, renderHook } from '@testing-library/react-native';
import * as ExpoRouter from 'expo-router';

import { useSeventvWs } from '@app/components/Chat/hooks/useSeventvWs';
import { ReadyState } from '@app/hooks/ws/constants';
import type { Options } from '@app/hooks/ws/types';
import * as useWebsocketModule from '@app/hooks/ws/useWebsocket';
import { logger } from '@app/utils/logger';
import * as sevenTvSessionIdModule from '@app/utils/seventv/sevenTvSessionId';
import {
  buildCosmeticCreateSubscribeMessage,
  buildCosmeticCreateUnsubscribeMessage,
  buildEmoteSetUpdateSubscribeMessage,
  buildEntitlementCreateSubscribeMessage,
  buildEntitlementCreateUnsubscribeMessage,
  buildResumeMessage,
  buildUserUpdateSubscribeMessage,
  buildUserUpdateUnsubscribeMessage,
} from '@app/utils/seventv/seventvWsInterpreter';

jest.spyOn(logger.chat, 'error').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'debug').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'error').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'info').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'warn').mockImplementation(() => {});

const mockUsePathname = jest.spyOn(ExpoRouter, 'usePathname');
const mockUseWebsocket = jest.spyOn(useWebsocketModule, 'useWebsocket');
const mockSetSevenTvSessionId = jest.spyOn(
  sevenTvSessionIdModule,
  'setSevenTvSessionId',
);

const createFakeWebSocket = (readyState: number): WebSocket => {
  const ws: WebSocket = Object.create(WebSocket.prototype);
  Object.defineProperty(ws, 'readyState', {
    value: readyState,
    configurable: true,
  });
  Object.defineProperty(ws, 'close', {
    value: jest.fn(),
    configurable: true,
  });
  return ws;
};

describe('useSeventvWs', () => {
  let capturedUrl: string | (() => string | Promise<string>) | null;
  let capturedOptions: Options | undefined;
  let sendJsonMessage: jest.Mock;
  let fakeWs: WebSocket;

  const hookOptions = {
    twitchChannelId: 'channel-1',
    sevenTvEmoteSetId: 'set-1',
    sevenTvChannelUserId: 'owner-1',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_700_000_000_000);
    mockUsePathname.mockReturnValue('/streams/live-stream/test-channel');
    sendJsonMessage = jest.fn();
    fakeWs = createFakeWebSocket(WebSocket.OPEN);
    mockUseWebsocket.mockImplementation((url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        sendMessage: jest.fn(),
        sendJsonMessage,
        readyState: ReadyState.OPEN,
        getWebSocket: () => fakeWs,
        reconnect: jest.fn(),
      };
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('connects and subscribes channel streams, owner and emote set on open', () => {
    renderHook(() => useSeventvWs(hookOptions));

    expect(capturedUrl).toBe('wss://events.7tv.io/v3');

    act(() => {
      void capturedOptions?.onOpen?.();
    });

    expect(sendJsonMessage.mock.calls).toEqual([
      [buildEntitlementCreateSubscribeMessage('channel-1', Date.now())],
      [buildCosmeticCreateSubscribeMessage('channel-1', Date.now())],
      [buildUserUpdateSubscribeMessage('owner-1')],
      [buildEmoteSetUpdateSubscribeMessage('set-1', Date.now())],
    ]);
  });

  test('unmount unsubscribes the channel-scoped streams and clears the shared session id', () => {
    const { unmount } = renderHook(() => useSeventvWs(hookOptions));

    act(() => {
      void capturedOptions?.onOpen?.();
    });
    sendJsonMessage.mockClear();

    unmount();

    expect(sendJsonMessage.mock.calls).toEqual([
      [buildEntitlementCreateUnsubscribeMessage('channel-1')],
      [buildCosmeticCreateUnsubscribeMessage('channel-1')],
      [buildUserUpdateUnsubscribeMessage('owner-1')],
    ]);
    expect(mockSetSevenTvSessionId).toHaveBeenCalledWith(null);
  });

  test('an unexpected close keeps the session but forces a resubscribe on the next open', () => {
    renderHook(() => useSeventvWs(hookOptions));

    act(() => {
      void capturedOptions?.onOpen?.();
    });
    sendJsonMessage.mockClear();

    act(() => {
      capturedOptions?.onClose?.(new CloseEvent('close', { code: 4008 }));
    });

    expect(mockSetSevenTvSessionId).not.toHaveBeenCalled();
    expect(sendJsonMessage).not.toHaveBeenCalled();

    act(() => {
      void capturedOptions?.onOpen?.();
    });

    expect(sendJsonMessage.mock.calls).toEqual([
      [buildEntitlementCreateSubscribeMessage('channel-1', Date.now())],
      [buildCosmeticCreateSubscribeMessage('channel-1', Date.now())],
      [buildUserUpdateSubscribeMessage('owner-1')],
      [buildEmoteSetUpdateSubscribeMessage('set-1', Date.now())],
    ]);
  });

  test('an unexpected close after a hello attempts RESUME instead of resubscribing', () => {
    renderHook(() => useSeventvWs(hookOptions));

    act(() => {
      void capturedOptions?.onOpen?.();
    });
    act(() => {
      capturedOptions?.onMessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            op: 1,
            d: { session_id: 'session-1', heartbeat_interval: 30_000 },
          }),
        }),
      );
    });
    expect(mockSetSevenTvSessionId).toHaveBeenCalledWith('session-1');

    act(() => {
      capturedOptions?.onClose?.(new CloseEvent('close', { code: 4008 }));
    });
    sendJsonMessage.mockClear();

    act(() => {
      void capturedOptions?.onOpen?.();
    });
    expect(sendJsonMessage).not.toHaveBeenCalled();

    act(() => {
      capturedOptions?.onMessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            op: 1,
            d: { session_id: 'session-2', heartbeat_interval: 30_000 },
          }),
        }),
      );
    });

    expect(sendJsonMessage.mock.calls).toEqual([
      [buildResumeMessage('session-1')],
    ]);
  });
});
