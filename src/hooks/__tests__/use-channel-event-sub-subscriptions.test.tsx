import { renderHook, waitFor } from '@testing-library/react-native';

import { createLoggedInViewerWrapper } from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import { useChannelPoll } from '@app/hooks/use-channel-poll';
import { useChannelPrediction } from '@app/hooks/use-channel-prediction';
import { twitchApi } from '@app/services/api/clients';
import TwitchWsService from '@app/services/twitch-ws-service';
import { logger } from '@app/utils/logger';

const mockSubscribeToEvent = jest.spyOn(TwitchWsService, 'subscribeToEvent');

jest
  .spyOn(TwitchWsService, 'unsubscribeFromEvent')
  .mockResolvedValue(undefined);

const mockTwitchGet = jest.spyOn(twitchApi, 'get');
jest.spyOn(logger.twitchWs, 'warn').mockImplementation(() => undefined);

describe('channel poll and prediction EventSub subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribeToEvent.mockResolvedValue(undefined);
    mockTwitchGet.mockResolvedValue({ data: [] });
  });

  test('skips poll and prediction subscriptions for channels the viewer does not own', () => {
    const wrapper = createLoggedInViewerWrapper('viewer-id');

    const prediction = renderHook(() => useChannelPrediction('channel-id'), {
      wrapper,
    });

    const poll = renderHook(() => useChannelPoll('channel-id'), { wrapper });

    expect(prediction.result.current.isAvailable).toBe(false);

    expect(poll.result.current.isAvailable).toBe(false);

    expect(mockSubscribeToEvent.mock.calls).toHaveLength(0);

    expect(mockTwitchGet).not.toHaveBeenCalled();
  });

  test('subscribes to poll and prediction events for the signed-in broadcaster', async () => {
    const wrapper = createLoggedInViewerWrapper('channel-id');

    const prediction = renderHook(() => useChannelPrediction('channel-id'), {
      wrapper,
    });

    const poll = renderHook(() => useChannelPoll('channel-id'), { wrapper });

    expect(prediction.result.current.isAvailable).toBe(true);

    expect(poll.result.current.isAvailable).toBe(true);

    await waitFor(() => {
      expect(mockSubscribeToEvent.mock.calls).toHaveLength(7);
    });

    const condition = { broadcaster_user_id: 'channel-id' };

    expect(
      mockSubscribeToEvent.mock.calls.map(([type, version, eventCondition]) => [
        type,
        version,
        eventCondition,
      ]),
    ).toEqual([
      ['channel.prediction.begin', '1', condition],
      ['channel.prediction.progress', '1', condition],
      ['channel.prediction.lock', '1', condition],
      ['channel.prediction.end', '1', condition],
      ['channel.poll.begin', '1', condition],
      ['channel.poll.progress', '1', condition],
      ['channel.poll.end', '1', condition],
    ]);

    const helixParams = {
      broadcaster_id: 'channel-id',
      id: undefined,
      first: 1,
      after: undefined,
    };

    expect(mockTwitchGet.mock.calls).toEqual([
      ['/predictions', { params: helixParams }],
      ['/polls', { params: helixParams }],
    ]);
  });
});
