import { renderHook } from '@testing-library/react-native';

import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { ReadyState } from '@app/hooks/ws/constants';
import { getSevenTvEmoteSetId } from '@app/store/chat/actions/channelLoad';

import { useSevenTvChatRuntime } from '../useSevenTvChatRuntime';

jest.mock('@app/hooks/useSeventvWs', () => ({
  useSeventvWs: jest.fn(),
}));

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getSevenTvEmoteSetId: jest.fn(),
  updateSevenTvEmotes: jest.fn(),
}));

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  fetchAndCacheUserCosmetics: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stvWs: {
      debug: jest.fn(),
      info: jest.fn(),
    },
  },
}));

const mockGetSevenTvEmoteSetId = jest.mocked(getSevenTvEmoteSetId);
const mockUseSeventvWs = jest.mocked(useSeventvWs);

// The runtime never reads `ws`; this yields a WebSocket-typed handle without an
// `as unknown as` reshape, and without opening a real jsdom socket.
const createWebSocketStub = (): WebSocket => Object.create(WebSocket.prototype);

function makeWsReturn({
  readyState,
  wsConnected,
  subscribeToChannel,
  unsubscribeFromChannel,
}: {
  readyState: ReadyState;
  wsConnected: boolean;
  subscribeToChannel: jest.Mock;
  unsubscribeFromChannel: jest.Mock;
}): ReturnType<typeof useSeventvWs> {
  return {
    getConnectionState: jest.fn(() => 'CONNECTED'),
    isConnected: jest.fn(() => wsConnected),
    readyState,
    subscribeToChannel,
    unsubscribeFromChannel,
    ws: createWebSocketStub(),
  };
}

function renderRuntime({
  currentEmoteSetIdRef = { current: null },
  emoteLoadStatus = 'success',
  readyState = ReadyState.OPEN,
  wsConnected = true,
}: {
  currentEmoteSetIdRef?: { current: string | null };
  emoteLoadStatus?: string;
  readyState?: ReadyState;
  wsConnected?: boolean;
} = {}) {
  const subscribeToChannel = jest.fn();
  const unsubscribeFromChannel = jest.fn();
  mockUseSeventvWs.mockReturnValue(
    makeWsReturn({
      readyState,
      wsConnected,
      subscribeToChannel,
      unsubscribeFromChannel,
    }),
  );

  const hook = renderHook(
    (props: Parameters<typeof useSevenTvChatRuntime>[0]) =>
      useSevenTvChatRuntime(props),
    {
      initialProps: {
        channelId: 'channel-1',
        channelName: 'foam',
        currentEmoteSetIdRef,
        emoteLoadStatus,
        handleNewMessage: jest.fn(),
        sevenTvEmoteSetId: 'set-from-loader',
      },
    },
  );

  return {
    currentEmoteSetIdRef,
    hook,
    subscribeToChannel,
    unsubscribeFromChannel,
  };
}

describe('useSevenTvChatRuntime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSevenTvEmoteSetId.mockReturnValue('set-1');
  });

  test('subscribes to the loaded 7TV emote set when the websocket and emotes are ready', () => {
    const { currentEmoteSetIdRef, subscribeToChannel } = renderRuntime();

    expect(subscribeToChannel.mock.calls).toEqual([['set-1']]);
    expect(currentEmoteSetIdRef.current).toBe('set-1');
    expect(mockGetSevenTvEmoteSetId).toHaveBeenCalledWith('channel-1');
  });

  test('does not subscribe before websocket connection or emote loading is ready', () => {
    const disconnected = renderRuntime({ wsConnected: false });
    const loading = renderRuntime({ emoteLoadStatus: 'loading' });

    expect(disconnected.subscribeToChannel.mock.calls).toEqual([]);
    expect(loading.subscribeToChannel.mock.calls).toEqual([]);
  });

  test('subscribes exactly once when the websocket reconnects from closed to open', () => {
    const currentEmoteSetIdRef = { current: null };
    // One stable pair of ws handlers across both connection states so the call
    // count accumulates and we can prove no double-subscribe on reconnect.
    const subscribeToChannel = jest.fn();
    const unsubscribeFromChannel = jest.fn();
    mockUseSeventvWs.mockReturnValue(
      makeWsReturn({
        readyState: ReadyState.CLOSED,
        wsConnected: false,
        subscribeToChannel,
        unsubscribeFromChannel,
      }),
    );

    const props = {
      channelId: 'channel-1',
      channelName: 'foam',
      currentEmoteSetIdRef,
      emoteLoadStatus: 'success',
      handleNewMessage: jest.fn(),
      sevenTvEmoteSetId: 'set-from-loader',
    };
    const hook = renderHook(
      (p: Parameters<typeof useSevenTvChatRuntime>[0]) =>
        useSevenTvChatRuntime(p),
      { initialProps: props },
    );

    expect(subscribeToChannel.mock.calls).toEqual([]);

    mockUseSeventvWs.mockReturnValue(
      makeWsReturn({
        readyState: ReadyState.OPEN,
        wsConnected: true,
        subscribeToChannel,
        unsubscribeFromChannel,
      }),
    );
    hook.rerender({ ...props });

    expect(subscribeToChannel.mock.calls).toEqual([['set-1']]);
    expect(currentEmoteSetIdRef.current).toBe('set-1');
  });

  test('unsubscribes the previous set before subscribing to a changed emote set', () => {
    const currentEmoteSetIdRef = { current: null };
    const { hook, subscribeToChannel, unsubscribeFromChannel } = renderRuntime({
      currentEmoteSetIdRef,
    });
    mockGetSevenTvEmoteSetId.mockReturnValue('set-2');

    hook.rerender({
      channelId: 'channel-2',
      channelName: 'foam',
      currentEmoteSetIdRef,
      emoteLoadStatus: 'success',
      handleNewMessage: jest.fn(),
      sevenTvEmoteSetId: 'set-from-loader',
    });

    expect(unsubscribeFromChannel.mock.calls).toEqual([[]]);
    expect(subscribeToChannel.mock.calls).toEqual([['set-1'], ['set-2']]);
    expect(currentEmoteSetIdRef.current).toBe('set-2');
  });

  test('unsubscribes and clears the emote set ref on unmount', () => {
    const { currentEmoteSetIdRef, hook, unsubscribeFromChannel } =
      renderRuntime();

    hook.unmount();

    expect(unsubscribeFromChannel.mock.calls).toEqual([[]]);
    expect(currentEmoteSetIdRef.current).toBe(null);
  });

  test('passes chat callback wiring into the websocket hook', () => {
    renderRuntime();
    const wsOptions = mockUseSeventvWs.mock.calls[0]?.[0];

    expect({
      hasCosmeticCreateHandler: typeof wsOptions?.onCosmeticCreate,
      hasEmoteUpdateHandler: typeof wsOptions?.onEmoteUpdate,
      hasEventLogger: typeof wsOptions?.onEvent,
    }).toEqual({
      hasCosmeticCreateHandler: 'function',
      hasEmoteUpdateHandler: 'function',
      hasEventLogger: 'function',
    });
  });
});
