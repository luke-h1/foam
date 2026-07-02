import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as baseRender, screen } from '@testing-library/react-native';

import { AuthContextTestProvider } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { twitchService as _twitchService } from '@app/services/twitch-service';
import type { UserInfoResponse } from '@app/types/twitch/user';

jest.mock('@app/services/twitch-service');
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

const twitchService = jest.mocked(_twitchService);

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

const mockStream = {
  id: '1',
  user_id: '111',
  user_login: 'livestreamer',
  user_name: 'LiveStreamer',
  game_id: '509658',
  game_name: 'Just Chatting',
  type: 'live' as const,
  title: 'Hanging out',
  viewer_count: 5000,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: '',
  tag_ids: [],
  tags: [],
  is_mature: false,
};

function renderFollowingScreen({ loggedIn }: { loggedIn: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
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
          populateAuthState={jest.fn()}
          fetchAnonToken={jest.fn()}
        >
          {children}
        </AuthContextTestProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );

  return baseRender(<FollowingScreen />, { wrapper });
}

describe('FollowingScreen', () => {
  test('shows sign-in empty state when not authenticated', () => {
    renderFollowingScreen({ loggedIn: false });

    expect(screen.getByText('Your followed streams')).toBeOnTheScreen();
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
  });

  test('shows loading skeletons while fetching for authenticated user', () => {
    twitchService.getFollowedStreams.mockReturnValue(new Promise(() => {}));

    renderFollowingScreen({ loggedIn: true });

    expect(screen.getAllByTestId('stream-skeleton').length).toBeGreaterThan(0);
  });

  test('renders followed streams for authenticated user', async () => {
    twitchService.getFollowedStreams.mockResolvedValue([mockStream]);
    twitchService.getUserImage.mockResolvedValue(
      'https://example.com/avatar.jpg',
    );

    renderFollowingScreen({ loggedIn: true });

    expect(await screen.findByText('LiveStreamer')).toBeOnTheScreen();
  });

  test('shows error state when fetch fails', async () => {
    twitchService.getFollowedStreams.mockRejectedValue(
      new Error('network error'),
    );

    renderFollowingScreen({ loggedIn: true });

    expect(
      await screen.findByText('Refresh', {}, { timeout: 15000 }),
    ).toBeOnTheScreen();
  }, 20000);

  test('shows empty state when no followed streams', async () => {
    twitchService.getFollowedStreams.mockResolvedValue([]);
    twitchService.getFollowedChannels.mockResolvedValue([]);

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
    expect(screen.getByText('Offline channels')).toBeOnTheScreen();
    // The live channel is filtered out of the offline section, so its name
    // appears only once (on the live stream card).
    expect(screen.getAllByText('LiveStreamer')).toHaveLength(1);
  });

  test('renders offline channels when no followed streams are live', async () => {
    twitchService.getFollowedStreams.mockResolvedValue([]);
    twitchService.getFollowedChannels.mockResolvedValue([
      {
        broadcaster_id: '222',
        broadcaster_login: 'sleepystreamer',
        broadcaster_name: 'SleepyStreamer',
        followed_at: '2024-01-01T00:00:00Z',
      },
    ]);
    twitchService.getUsersById.mockResolvedValue([]);

    renderFollowingScreen({ loggedIn: true });

    expect(await screen.findByText('SleepyStreamer')).toBeOnTheScreen();
    expect(screen.getByText('Offline channels')).toBeOnTheScreen();
    expect(screen.queryByText('No one is live')).not.toBeOnTheScreen();
  });
});
