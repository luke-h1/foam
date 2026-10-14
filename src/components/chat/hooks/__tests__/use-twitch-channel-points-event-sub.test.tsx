import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react-native';

import { useTwitchChannelPointsEventSub } from '@app/components/chat/hooks/use-twitch-channel-points-event-sub';
import {
  createLoggedInAuthContextValue,
  createLoggedOutAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import {
  AuthContextState,
  AuthContextTestProvider,
} from '@app/context/auth-context';
import TwitchWsService from '@app/services/twitch-ws-service';
import { logger } from '@app/utils/logger';

jest.spyOn(logger.chat, 'debug').mockImplementation(() => {});

const mockGetInstance = jest
  .spyOn(TwitchWsService, 'getInstance')
  .mockReturnValue(Object.create(WebSocket.prototype));

const mockSubscribeToEvent = jest.spyOn(TwitchWsService, 'subscribeToEvent');

const mockUnsubscribeFromEvent = jest.spyOn(
  TwitchWsService,
  'unsubscribeFromEvent',
);

function renderEventSub(authContext: AuthContextState) {
  return renderHook(() => useTwitchChannelPointsEventSub('channel-id'), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthContextTestProvider {...authContext}>
        {children}
      </AuthContextTestProvider>
    ),
  });
}

describe('useTwitchChannelPointsEventSub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInstance.mockReturnValue(Object.create(WebSocket.prototype));
    mockSubscribeToEvent.mockResolvedValue(undefined);
    mockUnsubscribeFromEvent.mockResolvedValue(undefined);
  });

  test('skips EventSub subscriptions when logged out', () => {
    renderEventSub(createLoggedOutAuthContextValue());

    expect(mockGetInstance).not.toHaveBeenCalled();
    expect(mockSubscribeToEvent).not.toHaveBeenCalled();
  });

  test('skips EventSub subscriptions when viewing another channel', () => {
    renderEventSub(
      createLoggedInAuthContextValue({
        user: createTestUser({ id: 'viewer-id' }),
      }),
    );

    expect(mockGetInstance).not.toHaveBeenCalled();
    expect(mockSubscribeToEvent).not.toHaveBeenCalled();
  });

  test('subscribes to channel point redemption events on your own channel', async () => {
    renderEventSub(
      createLoggedInAuthContextValue({
        user: createTestUser({ id: 'channel-id' }),
      }),
    );

    await waitFor(() => {
      expect(mockSubscribeToEvent.mock.calls).toHaveLength(2);
    });

    expect(mockSubscribeToEvent.mock.calls.map(call => call[0])).toEqual([
      'channel.channel_points_custom_reward_redemption.add',
      'channel.channel_points_automatic_reward_redemption.add',
    ]);

    expect(mockSubscribeToEvent.mock.calls[0]?.[2]).toEqual({
      broadcaster_user_id: 'channel-id',
    });
  });
});
