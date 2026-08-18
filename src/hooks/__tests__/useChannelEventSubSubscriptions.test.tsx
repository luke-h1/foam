import { renderHook, waitFor } from '@testing-library/react-native';

import {
  createLoggedInAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/authContext.fixture';
import * as AuthContextModule from '@app/context/AuthContext';
import { useChannelPoll } from '@app/hooks/useChannelPoll';
import { useChannelPrediction } from '@app/hooks/useChannelPrediction';
import { twitchService } from '@app/services/twitch-service';
import TwitchWsService from '@app/services/twitch-ws-service';
import { logger } from '@app/utils/logger';

const mockUseAuthContext = jest.spyOn(AuthContextModule, 'useAuthContext');
// SAFETY: getInstance's return value is never read by these hooks, only passed through.
const mockGetInstance = jest
  .spyOn(TwitchWsService, 'getInstance')
  .mockReturnValue({} as WebSocket);
const mockSubscribeToEvent = jest.spyOn(TwitchWsService, 'subscribeToEvent');
jest
  .spyOn(TwitchWsService, 'unsubscribeFromEvent')
  .mockResolvedValue(undefined);
const mockGetPolls = jest.spyOn(twitchService, 'getPolls');
const mockGetPredictions = jest.spyOn(twitchService, 'getPredictions');
jest.spyOn(logger.twitchWs, 'warn').mockImplementation(() => undefined);

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
    mockSubscribeToEvent.mockResolvedValue(undefined);
    mockGetPolls.mockResolvedValue({ data: [] });
    mockGetPredictions.mockResolvedValue({ data: [] });
  });

  test('skips poll and prediction subscriptions for channels the viewer does not own', () => {
    mockLoggedInViewer('viewer-id');

    const prediction = renderHook(() => useChannelPrediction('channel-id'));
    const poll = renderHook(() => useChannelPoll('channel-id'));

    expect(prediction.result.current.isAvailable).toBe(false);
    expect(poll.result.current.isAvailable).toBe(false);
    expect(mockGetInstance.mock.calls).toHaveLength(0);
    expect(mockSubscribeToEvent.mock.calls).toHaveLength(0);
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
      expect(mockSubscribeToEvent.mock.calls).toHaveLength(7);
    });

    expect(mockSubscribeToEvent.mock.calls.map(call => call[0])).toEqual([
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
