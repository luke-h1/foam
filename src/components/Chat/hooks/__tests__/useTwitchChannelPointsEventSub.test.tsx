import { renderHook, waitFor } from '@testing-library/react-native';

import { useTwitchChannelPointsEventSub } from '@app/components/Chat/hooks/useTwitchChannelPointsEventSub';
import {
  createLoggedInAuthContextValue,
  createLoggedOutAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/authContext.fixture';
import * as AuthContextModule from '@app/context/AuthContext';
import TwitchWsService from '@app/services/twitch-ws-service';
import { logger } from '@app/utils/logger';

jest.spyOn(logger.chat, 'debug').mockImplementation(() => {});

const mockUseAuthContext = jest.spyOn(AuthContextModule, 'useAuthContext');
const mockGetInstance = jest
  .spyOn(TwitchWsService, 'getInstance')
  .mockReturnValue(Object.create(WebSocket.prototype));
const mockSubscribeToEvent = jest.spyOn(TwitchWsService, 'subscribeToEvent');
const mockUnsubscribeFromEvent = jest.spyOn(
  TwitchWsService,
  'unsubscribeFromEvent',
);

describe('useTwitchChannelPointsEventSub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInstance.mockReturnValue(Object.create(WebSocket.prototype));
    mockSubscribeToEvent.mockResolvedValue(undefined);
    mockUnsubscribeFromEvent.mockResolvedValue(undefined);
  });

  test('skips EventSub subscriptions when logged out', () => {
    mockUseAuthContext.mockReturnValue(createLoggedOutAuthContextValue());

    renderHook(() => useTwitchChannelPointsEventSub('channel-id'));

    expect(mockGetInstance).not.toHaveBeenCalled();
    expect(mockSubscribeToEvent).not.toHaveBeenCalled();
  });

  test('skips EventSub subscriptions when viewing another channel', () => {
    mockUseAuthContext.mockReturnValue(
      createLoggedInAuthContextValue({
        user: createTestUser({ id: 'viewer-id' }),
      }),
    );

    renderHook(() => useTwitchChannelPointsEventSub('channel-id'));

    expect(mockGetInstance).not.toHaveBeenCalled();
    expect(mockSubscribeToEvent).not.toHaveBeenCalled();
  });

  test('subscribes to channel point redemption events on your own channel', async () => {
    mockUseAuthContext.mockReturnValue(
      createLoggedInAuthContextValue({
        user: createTestUser({ id: 'channel-id' }),
      }),
    );

    renderHook(() => useTwitchChannelPointsEventSub('channel-id'));

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
