import { renderHook } from '@testing-library/react-native';

import * as useSeventvWsModule from '@app/components/Chat/hooks/useSeventvWs';
import { ReadyState } from '@app/hooks/ws/constants';
import * as sevenTvChannelLifecycleActions from '@app/store/chat/actions/sevenTvChannelLifecycle';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { makeEmptyEmoteData } from '@app/store/chat/types/constants';
import { logger } from '@app/utils/logger';

import { useSevenTvChatRuntime } from '../useSevenTvChatRuntime';

jest.spyOn(logger.stvWs, 'debug').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'info').mockImplementation(() => {});

const mockGetSevenTvEmoteSetId = jest.spyOn(
  sevenTvChannelLifecycleActions,
  'getSevenTvEmoteSetId',
);
const mockUseSeventvWs = jest.spyOn(useSeventvWsModule, 'useSeventvWs');

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
}): ReturnType<typeof useSeventvWsModule.useSeventvWs> {
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
    chatStore$.persisted.channelCaches.set({
      'channel-1': { ...makeEmptyEmoteData(), sevenTvEmoteSetId: 'set-1' },
      'channel-2': { ...makeEmptyEmoteData(), sevenTvEmoteSetId: 'set-2' },
    });
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
    expect(currentEmoteSetIdRef.current).toBeNull();
  });

  test('passes chat callback wiring into the websocket hook', () => {
    renderRuntime();
    const wsOptions = mockUseSeventvWs.mock.calls[0]?.[0];

    expect({
      hasCosmeticCreateHandler: wsOptions?.onCosmeticCreate instanceof Function,
      hasEmoteUpdateHandler: wsOptions?.onEmoteUpdate instanceof Function,
      hasEventLogger: wsOptions?.onEvent instanceof Function,
    }).toEqual({
      hasCosmeticCreateHandler: true,
      hasEmoteUpdateHandler: true,
      hasEventLogger: true,
    });
  });
});
