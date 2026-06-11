import { render, screen } from '@testing-library/react-native';
import { useTopStreamsQuery as _useTopStreamsQuery } from '@app/hooks/queries/use-top-streams-query';
import { TopStreamsScreen } from '../TopStreamsScreen';

jest.mock('@app/hooks/queries/use-top-streams-query');
jest.mock('@app/hooks/useScrollToTop', () => ({ useScrollToTop: jest.fn() }));
jest.mock('@app/hooks/useRefetchOnForeground', () => ({
  useRefetchOnForeground: jest.fn(),
}));
jest.mock('@app/hooks/useDebouncedCallback', () => ({
  useDebouncedCallback: (fn: unknown) => [fn],
}));
jest.mock('@app/hooks/useInfiniteQueryLoadMore', () => ({
  useInfiniteQueryLoadMore: jest.fn(() => jest.fn()),
}));
jest.mock('@app/store/preferenceStore', () => ({
  usePreference: jest.fn(() => 'compact'),
  useUpdatePreferences: jest.fn(() => jest.fn()),
}));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
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

const useTopStreamsQuery = jest.mocked(_useTopStreamsQuery);

const mockRefetch = jest.fn();
const mockFetchNextPage = jest.fn();

const baseQueryResult = {
  data: undefined,
  fetchNextPage: mockFetchNextPage,
  refetch: mockRefetch,
  hasNextPage: false,
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
} as unknown as ReturnType<typeof _useTopStreamsQuery>;

const mockStream = {
  id: '1',
  user_id: '100',
  user_login: 'streamer1',
  user_name: 'Streamer1',
  game_id: '509658',
  game_name: 'Just Chatting',
  type: 'live' as const,
  title: 'Test stream',
  viewer_count: 10000,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: 'https://example.com/thumb.jpg',
  tag_ids: [],
  tags: [],
  is_mature: false,
};

describe('TopStreamsScreen', () => {
  test('shows loading skeletons while fetching', () => {
    useTopStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, { isLoading: true }),
    );

    render(<TopStreamsScreen />);

    expect(screen.getAllByTestId('stream-skeleton').length).toBeGreaterThan(0);
  });

  test('renders stream list when data is available', () => {
    useTopStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, {
        data: { pages: [{ data: [mockStream] }], pageParams: [] },
      }),
    );

    render(<TopStreamsScreen />);

    expect(screen.getByText('Streamer1')).toBeTruthy();
  });

  test('shows empty state when no streams returned', () => {
    useTopStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, {
        data: { pages: [{ data: [] }], pageParams: [] },
      }),
    );

    render(<TopStreamsScreen />);

    expect(screen.getByText('No Top Streams found')).toBeTruthy();
  });

  test('shows empty state when data is undefined', () => {
    useTopStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, { data: undefined }),
    );

    render(<TopStreamsScreen />);

    expect(screen.getByText('No Top Streams found')).toBeTruthy();
  });

  test('renders multiple streams', () => {
    useTopStreamsQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, {
        data: {
          pages: [
            {
              data: [
                mockStream,
                { ...mockStream, id: '2', user_name: 'Streamer2' },
              ],
            },
          ],
          pageParams: [],
        },
      }),
    );

    render(<TopStreamsScreen />);

    expect(screen.getByText('Streamer1')).toBeTruthy();
    expect(screen.getByText('Streamer2')).toBeTruthy();
  });
});
