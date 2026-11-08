import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  render as baseRender,
  screen,
} from '@testing-library/react-native';

import { AuthContextTestProvider } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/following/FollowingScreen';
import { createTwitchStream } from '@app/services/__fixtures__/twitch/stream.fixture';
import { twitchService as realTwitchService } from '@app/services/twitch-service';
import { createTestQueryClient } from '@app/test/render';
import { TEST_SAFE_AREA_METRICS } from '@app/test/safe-area';
import type { UserInfoResponse } from '@app/types/twitch/user';

const twitchService = {
  getFollowedStreams: jest.spyOn(realTwitchService, 'getFollowedStreams'),
  getFollowedChannels: jest.spyOn(realTwitchService, 'getFollowedChannels'),
  getUsersById: jest.spyOn(realTwitchService, 'getUsersById'),
};

const TEST_TOKEN_EXPIRES_AT = 4_102_444_800_000;

const mockUser: UserInfoResponse = {
  id: '123456',
  login: 'blueberry42',
  display_name: 'Blueberry42',
  type: '',
  broadcaster_type: 'partner',
  description: '',
  profile_image_url: '',
  offline_image_url: '',
  view_count: 0,
  created_at: '',
};

const mockStream = createTwitchStream({
  user_id: '111',
  user_login: 'livestreamer',
  user_name: 'LiveStreamer',
  title: 'Hanging out',
  viewer_count: 5000,
  thumbnail_url: '',
});

function renderFollowingScreen({ loggedIn }: { loggedIn: boolean }) {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={queryClient}>
        <AuthContextTestProvider
          ready
          authState={{
            isLoggedIn: loggedIn,
            isAnonAuth: !loggedIn,
            token: {
              accessToken: 'test-token',
              expiresIn: 3600,
              tokenType: 'bearer',
              expiresAt: TEST_TOKEN_EXPIRES_AT,
            },
          }}
          user={loggedIn ? mockUser : undefined}
          loginWithTwitch={jest.fn()}
          logout={jest.fn()}
        >
          {children}
        </AuthContextTestProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );

  return baseRender(<FollowingScreen />, { wrapper });
}

describe('FollowingScreen', () => {
  beforeEach(() => {
    twitchService.getFollowedStreams.mockResolvedValue([]);
    twitchService.getFollowedChannels.mockResolvedValue([]);
    twitchService.getUsersById.mockResolvedValue([]);
  });

  afterEach(() => {
    twitchService.getFollowedStreams.mockReset();
    twitchService.getFollowedChannels.mockReset();
    twitchService.getUsersById.mockReset();
    jest.useRealTimers();
  });

  test('shows sign-in empty state when not authenticated', () => {
    renderFollowingScreen({ loggedIn: false });

    expect(screen.getByText('Your followed streams')).toBeOnTheScreen();

    expect(screen.getByText('Sign in')).toBeOnTheScreen();
  });

  test('shows loading skeletons while fetching for authenticated user', () => {
    twitchService.getFollowedStreams.mockReturnValue(new Promise(() => {}));

    renderFollowingScreen({ loggedIn: true });

    expect(screen.getAllByTestId('stream-skeleton')[0]).toBeOnTheScreen();
  });

  test('renders followed streams for authenticated user', async () => {
    twitchService.getFollowedStreams.mockResolvedValue([mockStream]);

    renderFollowingScreen({ loggedIn: true });

    expect(await screen.findByText('LiveStreamer')).toBeOnTheScreen();
  });

  test('shows error state when fetch fails after retries', async () => {
    jest.useFakeTimers();

    twitchService.getFollowedStreams.mockRejectedValue(
      new Error('network error'),
    );

    renderFollowingScreen({ loggedIn: true });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(10_000);
    });

    expect(screen.getByText('Try again')).toBeOnTheScreen();

    expect(twitchService.getFollowedStreams).toHaveBeenCalledTimes(3);
  });

  test('shows empty state when no followed streams', async () => {
    renderFollowingScreen({ loggedIn: true });

    expect(await screen.findByText('No one is live')).toBeOnTheScreen();
  });

  test('renders offline followed channels below live streams', async () => {
    twitchService.getFollowedStreams.mockResolvedValue([mockStream]);

    twitchService.getFollowedChannels.mockResolvedValue([
      {
        broadcaster_id: '111',
        broadcaster_login: 'livestreamer',
        broadcaster_name: 'LiveStreamer',
        followed_at: '2024-01-01T00:00:00Z',
      },
      {
        broadcaster_id: '222',
        broadcaster_login: 'sleepystreamer',
        broadcaster_name: 'SleepyStreamer',
        followed_at: '2024-01-01T00:00:00Z',
      },
    ]);

    twitchService.getUsersById.mockResolvedValue([
      {
        id: '222',
        login: 'sleepystreamer',
        display_name: 'SleepyStreamer',
        type: '',
        broadcaster_type: '',
        description: '',
        profile_image_url: 'https://example.com/sleepy.png',
        offline_image_url: '',
        view_count: 0,
        created_at: '',
      },
    ]);

    renderFollowingScreen({ loggedIn: true });

    expect(await screen.findByText('SleepyStreamer')).toBeOnTheScreen();

    expect(screen.getByText(/^Offline/)).toBeOnTheScreen();

    // The live channel is filtered out of the offline section, so its name appears once (on the live card).
    expect(screen.getAllByText('LiveStreamer')).toHaveLength(1);
  });

  test('renders offline channels when no followed streams are live', async () => {
    twitchService.getFollowedChannels.mockResolvedValue([
      {
        broadcaster_id: '222',
        broadcaster_login: 'sleepystreamer',
        broadcaster_name: 'SleepyStreamer',
        followed_at: '2024-01-01T00:00:00Z',
      },
    ]);

    renderFollowingScreen({ loggedIn: true });

    expect(await screen.findByText('SleepyStreamer')).toBeOnTheScreen();

    expect(screen.getByText(/^Offline/)).toBeOnTheScreen();

    expect(
      screen.getByText('Nobody you follow is live right now.'),
    ).toBeOnTheScreen();

    expect(screen.queryByText('No one is live')).not.toBeOnTheScreen();
  });
});
