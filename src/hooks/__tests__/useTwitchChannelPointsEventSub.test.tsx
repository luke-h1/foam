import { useAuthContext } from '@app/context/AuthContext';
import {
  createLoggedInAuthContextValue,
  createLoggedOutAuthContextValue,
} from '@app/context/__tests__/__fixtures__/authContext.fixture';
import { useTwitchChannelPointsEventSub } from '@app/hooks/useTwitchChannelPointsEventSub';
import TwitchWsService from '@app/services/twitch-ws-service';
import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@app/services/twitch-ws-service', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(),
    subscribeToEvent: jest.fn(),
    unsubscribeFromEvent: jest.fn(),
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
    },
  },
}));

const mockUseAuthContext = jest.mocked(useAuthContext);
const mockTwitchWsService = jest.mocked(TwitchWsService);

describe('useTwitchChannelPointsEventSub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTwitchWsService.getInstance.mockReturnValue(
      null as unknown as WebSocket,
    );
    mockTwitchWsService.subscribeToEvent.mockResolvedValue(undefined);
    mockTwitchWsService.unsubscribeFromEvent.mockResolvedValue(undefined);
  });

  test('skips EventSub subscriptions when logged out', () => {
    mockUseAuthContext.mockReturnValue(createLoggedOutAuthContextValue());

    renderHook(() => useTwitchChannelPointsEventSub('channel-id'));

    expect(mockTwitchWsService.getInstance).not.toHaveBeenCalled();
    expect(mockTwitchWsService.subscribeToEvent).not.toHaveBeenCalled();
  });

  test('subscribes to channel point redemption events when logged in', async () => {
    mockUseAuthContext.mockReturnValue(createLoggedInAuthContextValue());

    renderHook(() => useTwitchChannelPointsEventSub('channel-id'));

    await waitFor(() => {
      expect(mockTwitchWsService.subscribeToEvent.mock.calls).toHaveLength(2);
    });

    expect(
      mockTwitchWsService.subscribeToEvent.mock.calls.map(call => call[0]),
    ).toEqual([
      'channel.channel_points_custom_reward_redemption.add',
      'channel.channel_points_automatic_reward_redemption.add',
    ]);
    expect(mockTwitchWsService.subscribeToEvent.mock.calls[0]?.[2]).toEqual({
      broadcaster_user_id: 'channel-id',
    });
  });
});
