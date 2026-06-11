import { render, screen } from '@testing-library/react-native';
import { useFollowedStreamsQuery as _useFollowedStreamsQuery } from '@app/hooks/queries/use-followed-streams-query';
import { useAuthContext as _useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';

jest.mock('@app/hooks/queries/use-followed-streams-query');
jest.mock('@app/context/AuthContext');
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: jest.fn(() => ({ refetchQueries: jest.fn() })),
}));
jest.mock('@app/hooks/useScrollToTop', () => ({ useScrollToTop: jest.fn() }));
jest.mock('@app/hooks/useRefetchOnForeground', () => ({
  useRefetchOnForeground: jest.fn(),
}));
jest.mock('@app/hooks/useRefresh', () => ({
  useRefresh: jest.fn(() => ({
    scrollHandler: jest.fn(),
    scrollY: { value: 0, get: () => 0, set: jest.fn() },
    isRefreshing: false,
    refreshControl: null,
  })),
}));
jest.mock('@app/components/TabBarBackground/useBottomTabOverflow', () => ({
  useBottomTabOverflow: jest.fn(() => 0),
}));
jest.mock('@app/store/preferenceStore', () => ({
  usePreference: jest.fn(() => 'compact'),
  useUpdatePreferences: jest.fn(() => jest.fn()),
}));
jest.mock('@app/components/LiveStreamCard/LiveStreamCard', () => ({
  MemoizedLiveStreamCard: ({ stream }: { stream: { user_name: string } }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, stream.user_name);
  },
}));
jest.mock('@app/components/LiveStreamCard/LiveStreamCardSkeleton', () => ({
  LiveStreamCardSkeleton: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'stream-skeleton' });
  },
}));
jest.mock('@app/components/FlashList/AnimatedFlashList', () => ({
  AnimatedFlashList: jest.requireMock('@shopify/flash-list').FlashList,
}));
jest.mock('@app/components/RefreshControl/RefreshIndicator', () => ({
  RefreshIndicator: () => null,
}));
jest.mock(
  '@app/components/EditorialSectionHeader/EditorialSectionHeader',
  () => ({
    EditorialSectionHeader: () => null,
  }),
);
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: jest.fn(() => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    })),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

const useFollowedStreamsQuery = jest.mocked(_useFollowedStreamsQuery);
const useAuthContext = jest.mocked(_useAuthContext);

const mockUser = {
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

const baseQueryResult = {
  data: undefined,
  refetch: jest.fn(),
  isLoading: false,
  isFetching: false,
  isError: false,
  isFetched: false,
} as unknown as ReturnType<typeof _useFollowedStreamsQuery>;

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

describe('FollowingScreen', () => {
  test('shows sign-in empty state when not authenticated', () => {
    useAuthContext.mockReturnValue({
      authState: { isLoggedIn: false },
      user: null,
    } as unknown as ReturnType<typeof _useAuthContext>);
    useFollowedStreamsQuery.mockReturnValue({ ...baseQueryResult });

    render(<FollowingScreen />);

    expect(screen.getByText('Your followed streams')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  test('shows loading skeletons while fetching for authenticated user', () => {
    useAuthContext.mockReturnValue({
      authState: { isLoggedIn: true },
      user: mockUser,
    } as unknown as ReturnType<typeof _useAuthContext>);
    useFollowedStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, { isLoading: true }),
    );

    render(<FollowingScreen />);

    expect(screen.getAllByTestId('stream-skeleton').length).toBeGreaterThan(0);
  });

  test('renders followed streams for authenticated user', () => {
    useAuthContext.mockReturnValue({
      authState: { isLoggedIn: true },
      user: mockUser,
    } as unknown as ReturnType<typeof _useAuthContext>);
    useFollowedStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, {
        data: [mockStream],
        isFetched: true,
      }),
    );

    render(<FollowingScreen />);

    expect(screen.getByText('LiveStreamer')).toBeTruthy();
  });

  test('shows error state when fetch fails', () => {
    useAuthContext.mockReturnValue({
      authState: { isLoggedIn: true },
      user: mockUser,
    } as unknown as ReturnType<typeof _useAuthContext>);
    useFollowedStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, { isError: true, isFetched: true }),
    );

    render(<FollowingScreen />);

    expect(screen.getByText('Refresh')).toBeTruthy();
  });

  test('shows empty state when no followed streams', () => {
    useAuthContext.mockReturnValue({
      authState: { isLoggedIn: true },
      user: mockUser,
    } as unknown as ReturnType<typeof _useAuthContext>);
    useFollowedStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, { data: [], isFetched: true }),
    );

    render(<FollowingScreen />);

    expect(screen.getByText('No one is live')).toBeTruthy();
  });
});
