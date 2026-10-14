import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react-native';

import {
  createLoggedInAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import { AuthContextTestProvider } from '@app/context/auth-context';
import { useChannelPoll } from '@app/hooks/use-channel-poll';
import { useChannelPrediction } from '@app/hooks/use-channel-prediction';
import { twitchApi } from '@app/services/api/clients';
import TwitchWsService from '@app/services/twitch-ws-service';
import { logger } from '@app/utils/logger';

// SAFETY: getInstance's return value is never read by these hooks, only passed through.
const mockGetInstance = jest
  .spyOn(TwitchWsService, 'getInstance')
  .mockReturnValue({} as WebSocket);

const mockSubscribeToEvent = jest.spyOn(TwitchWsService, 'subscribeToEvent');

jest
  .spyOn(TwitchWsService, 'unsubscribeFromEvent')
  .mockResolvedValue(undefined);

const mockTwitchGet = jest.spyOn(twitchApi, 'get');
jest.spyOn(logger.twitchWs, 'warn').mockImplementation(() => undefined);

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

describe('channel poll and prediction EventSub subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribeToEvent.mockResolvedValue(undefined);
    mockTwitchGet.mockResolvedValue({ data: [] });
  });

  test('skips poll and prediction subscriptions for channels the viewer does not own', () => {
    const wrapper = loggedInViewer('viewer-id');

    const prediction = renderHook(() => useChannelPrediction('channel-id'), {
      wrapper,
    });

    const poll = renderHook(() => useChannelPoll('channel-id'), { wrapper });

    expect(prediction.result.current.isAvailable).toBe(false);
    expect(poll.result.current.isAvailable).toBe(false);
    expect(mockGetInstance.mock.calls).toHaveLength(0);
    expect(mockSubscribeToEvent.mock.calls).toHaveLength(0);
    expect(mockTwitchGet).not.toHaveBeenCalled();
  });

  test('subscribes to poll and prediction events for the signed-in broadcaster', async () => {
    const wrapper = loggedInViewer('channel-id');

    const prediction = renderHook(() => useChannelPrediction('channel-id'), {
      wrapper,
    });

    const poll = renderHook(() => useChannelPoll('channel-id'), { wrapper });

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
