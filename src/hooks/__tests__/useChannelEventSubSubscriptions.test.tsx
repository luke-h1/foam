import { useAuthContext } from '@app/context/AuthContext';
import {
  createLoggedInAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/authContext.fixture';
import { useChannelPoll } from '@app/hooks/useChannelPoll';
import { useChannelPrediction } from '@app/hooks/useChannelPrediction';
import TwitchWsService from '@app/services/twitch-ws-service';
import { twitchService } from '@app/services/twitch-service';
import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@app/services/twitch-ws-service', () => ({
  __esModule: true,
  default: {
    disconnect: jest.fn(),
    getInstance: jest.fn(),
    subscribeToEvent: jest.fn(),
    unsubscribeFromEvent: jest.fn(),
  },
}));

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    getPolls: jest.fn(),
    getPredictions: jest.fn(),
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    twitchWs: {
      warn: jest.fn(),
    },
  },
}));

const mockUseAuthContext = jest.mocked(useAuthContext);
const mockTwitchWsService = jest.mocked(TwitchWsService);
const mockGetPolls = jest.mocked(twitchService.getPolls);
const mockGetPredictions = jest.mocked(twitchService.getPredictions);

function mockLoggedInViewer(userId: string) {
  mockUseAuthContext.mockReturnValue(
    createLoggedInAuthContextValue({
      user: createTestUser({ id: userId }),
    }),
  );
}

describe('channel poll and prediction EventSub subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTwitchWsService.getInstance.mockReturnValue(
      null as unknown as WebSocket,
    );
    mockTwitchWsService.subscribeToEvent.mockResolvedValue(undefined);
    mockGetPolls.mockResolvedValue({ data: [] });
    mockGetPredictions.mockResolvedValue({ data: [] });
  });

  test('skips poll and prediction subscriptions for channels the viewer does not own', () => {
    mockLoggedInViewer('viewer-id');

    const prediction = renderHook(() => useChannelPrediction('channel-id'));
    const poll = renderHook(() => useChannelPoll('channel-id'));

    expect(prediction.result.current.isAvailable).toBe(false);
    expect(poll.result.current.isAvailable).toBe(false);
    expect(mockTwitchWsService.getInstance.mock.calls).toHaveLength(0);
    expect(mockTwitchWsService.subscribeToEvent.mock.calls).toHaveLength(0);
    expect(mockGetPredictions).not.toHaveBeenCalled();
    expect(mockGetPolls).not.toHaveBeenCalled();
  });

  test('subscribes to poll and prediction events for the signed-in broadcaster', async () => {
    mockLoggedInViewer('channel-id');

    const prediction = renderHook(() => useChannelPrediction('channel-id'));
    const poll = renderHook(() => useChannelPoll('channel-id'));

    expect(prediction.result.current.isAvailable).toBe(true);
    expect(poll.result.current.isAvailable).toBe(true);

    await waitFor(() => {
      expect(mockTwitchWsService.subscribeToEvent.mock.calls).toHaveLength(7);
    });

    expect(
      mockTwitchWsService.subscribeToEvent.mock.calls.map(call => call[0]),
    ).toEqual([
      'channel.prediction.begin',
      'channel.prediction.progress',
      'channel.prediction.lock',
      'channel.prediction.end',
      'channel.poll.begin',
      'channel.poll.progress',
      'channel.poll.end',
    ]);
    expect(mockGetPredictions).toHaveBeenCalledWith({
      broadcasterId: 'channel-id',
      first: 1,
    });
    expect(mockGetPolls).toHaveBeenCalledWith({
      broadcasterId: 'channel-id',
      first: 1,
    });
  });
});
