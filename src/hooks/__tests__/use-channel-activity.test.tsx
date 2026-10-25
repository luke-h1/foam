import type { ReactNode } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  createLoggedInAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import { AuthContextTestProvider } from '@app/context/auth-context';
import type { TestActivityState } from '@app/hooks/__tests__/__fixtures__/use-channel-activity.fixture';
import {
  createEventSubMessage,
  createTestActivity,
} from '@app/hooks/__tests__/__fixtures__/use-channel-activity.fixture';
import { useChannelActivity } from '@app/hooks/use-channel-activity';
import TwitchWsService from '@app/services/twitch-ws-service';
import { logger } from '@app/utils/logger';

// SAFETY: getInstance's return value is never read by this hook, only passed through.
const mockGetInstance = jest
  .spyOn(TwitchWsService, 'getInstance')
  .mockReturnValue({} as WebSocket);

const mockSubscribeToEvent = jest.spyOn(TwitchWsService, 'subscribeToEvent');

const mockUnsubscribeFromEvent = jest.spyOn(
  TwitchWsService,
  'unsubscribeFromEvent',
);

const mockWarn = jest
  .spyOn(logger.twitchWs, 'warn')
  .mockImplementation(() => undefined);

function loggedInViewer(userId: string) {
  const authValue = createLoggedInAuthContextValue({
    user: createTestUser({ id: userId }),
  });

  return function LoggedInViewer({ children }: { children: ReactNode }) {
    return (
      <AuthContextTestProvider {...authValue}>
        {children}
      </AuthContextTestProvider>
    );
  };
}

function getSubscribedHandler(type: string) {
  const call = mockSubscribeToEvent.mock.calls.find(
    subscribeCall => subscribeCall[0] === type,
  );

  const handler = call?.[3];

  if (!handler) {
    throw new Error(`no subscription registered for ${type}`);
  }

  return handler;
}

describe('useChannelActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // SAFETY: getInstance's return value is never read by this hook, only passed through.
    mockGetInstance.mockReturnValue({} as WebSocket);

    mockSubscribeToEvent.mockResolvedValue(undefined);
    mockUnsubscribeFromEvent.mockResolvedValue(undefined);
  });

  test('skips fetch and subscriptions for channels the viewer does not own', () => {
    const wrapper = loggedInViewer('viewer-id');

    const fetch = jest.fn((broadcasterId: string) =>
      Promise.resolve({
        data: [{ id: broadcasterId, status: 'ACTIVE' as const }],
      }),
    );

    const descriptor = createTestActivity({ fetch });

    const { result } = renderHook(
      () => useChannelActivity(descriptor, 'channel-id'),
      { wrapper },
    );

    expect(result.current.value).toBeNull();

    expect(result.current.isAvailable).toBe(false);

    expect(fetch).not.toHaveBeenCalled();

    expect(mockGetInstance).not.toHaveBeenCalled();

    expect(mockSubscribeToEvent).not.toHaveBeenCalled();
  });

  test('fetches the active value and subscribes for the signed-in broadcaster', async () => {
    const wrapper = loggedInViewer('channel-id');

    const fetch = jest.fn((_broadcasterId: string) =>
      Promise.resolve({
        data: [
          { id: 'helix-completed', status: 'COMPLETED' as const },
          { id: 'helix-active', status: 'ACTIVE' as const },
        ],
      }),
    );

    const descriptor = createTestActivity({ fetch });

    const { result } = renderHook(
      () => useChannelActivity(descriptor, 'channel-id'),
      { wrapper },
    );

    expect(result.current.isAvailable).toBe(true);

    await waitFor(() => {
      expect(result.current.value).toEqual<TestActivityState>({
        id: 'helix-active',
        status: 'active',
        source: 'helix',
      });
    });

    expect(fetch).toHaveBeenCalledWith('channel-id');

    expect(
      mockSubscribeToEvent.mock.calls.map(call => [call[0], call[1], call[2]]),
    ).toEqual([
      ['channel.test.begin', '1', { broadcaster_user_id: 'channel-id' }],
      ['channel.test.end', '1', { broadcaster_user_id: 'channel-id' }],
    ]);
  });

  test('updates the value from descriptor-normalised EventSub events', async () => {
    const wrapper = loggedInViewer('channel-id');

    const descriptor = createTestActivity({
      fetch: () =>
        Promise.resolve({ data: [{ id: 'helix-active', status: 'ACTIVE' }] }),
    });

    const { result } = renderHook(
      () => useChannelActivity(descriptor, 'channel-id'),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.value).toEqual<TestActivityState>({
        id: 'helix-active',
        status: 'active',
        source: 'helix',
      });
    });

    const onEnd = getSubscribedHandler('channel.test.end');

    act(() => {
      onEnd(createEventSubMessage({ id: 'event-1' }));
    });

    expect(result.current.value).toEqual<TestActivityState>({
      id: 'event-1',
      status: 'completed',
      source: 'event',
    });

    act(() => {
      onEnd(createEventSubMessage(undefined));
    });

    expect(result.current.value).toEqual<TestActivityState>({
      id: 'event-1',
      status: 'completed',
      source: 'event',
    });
  });

  test('resets the value when the channel scope changes', async () => {
    const wrapper = loggedInViewer('channel-a');

    const descriptor = createTestActivity({
      fetch: broadcasterId =>
        Promise.resolve({
          data: [{ id: `${broadcasterId}-item`, status: 'ACTIVE' }],
        }),
    });

    const { result, rerender } = renderHook(
      ({ channelId }: { channelId: string }) =>
        useChannelActivity(descriptor, channelId),
      { initialProps: { channelId: 'channel-a' }, wrapper },
    );

    await waitFor(() => {
      expect(result.current.value).toEqual<TestActivityState>({
        id: 'channel-a-item',
        status: 'active',
        source: 'helix',
      });
    });

    rerender({ channelId: 'channel-b' });

    expect(result.current.value).toBeNull();

    expect(result.current.isAvailable).toBe(false);
  });

  test('unsubscribes the descriptor events on unmount', () => {
    const wrapper = loggedInViewer('channel-id');
    const descriptor = createTestActivity();

    const { unmount } = renderHook(
      () => useChannelActivity(descriptor, 'channel-id'),
      { wrapper },
    );

    const subscribed = mockSubscribeToEvent.mock.calls.map(call => [
      call[0],
      call[3],
    ]);

    expect(subscribed.map(entry => entry[0])).toEqual([
      'channel.test.begin',
      'channel.test.end',
    ]);

    unmount();

    expect(mockUnsubscribeFromEvent.mock.calls).toEqual(subscribed);
  });

  test('logs fetch failures with the descriptor log fields', async () => {
    const wrapper = loggedInViewer('channel-id');
    const error = new Error('helix down');

    const descriptor = createTestActivity({
      fetch: () => Promise.reject(error),
    });

    const { result } = renderHook(
      () => useChannelActivity(descriptor, 'channel-id'),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockWarn).toHaveBeenCalledWith(
        'Failed to fetch test activity state',
        {
          name: 'test_activity_warning',
          error,
          action: 'initial_test_activity_fetch_failed',
          channel_id: 'channel-id',
          provider: 'twitch',
          screen: 'chat',
        },
      );
    });

    expect(result.current.value).toBeNull();

    expect(result.current.isAvailable).toBe(true);
  });
});
