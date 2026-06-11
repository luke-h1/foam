import { render, screen } from '@testing-library/react-native';
import { useCategoryQuery as _useCategoryQuery } from '@app/hooks/queries/use-category-query';
import { useStreamsByCategoryQuery as _useStreamsByCategoryQuery } from '@app/hooks/queries/use-streams-by-category-query';
import { CategoryScreen } from '@app/screens/CategoryScreen';

jest.mock('@app/hooks/queries/use-category-query');
jest.mock('@app/hooks/queries/use-streams-by-category-query');
jest.mock('@app/hooks/useScrollToTop', () => ({ useScrollToTop: jest.fn() }));
jest.mock('@app/hooks/useInfiniteQueryLoadMore', () => ({
  useInfiniteQueryLoadMore: jest.fn(() => jest.fn()),
}));
jest.mock('@app/components/FlashList/FlashList', () => ({
  FlashList: jest.fn(
    ({
      data = [],
      renderItem,
      ListHeaderComponent,
      ListEmptyComponent,
      ...props
    }: {
      data?: unknown[];
      renderItem?: (args: { item: unknown; index: number }) => React.ReactNode;
      ListHeaderComponent?: React.ComponentType | React.ReactNode;
      ListEmptyComponent?: React.ComponentType | React.ReactNode;
    }) => {
      const React = require('react');
      const header =
        typeof ListHeaderComponent === 'function'
          ? React.createElement(ListHeaderComponent)
          : (ListHeaderComponent ?? null);
      const items = data.map((item, index) =>
        React.createElement(
          React.Fragment,
          { key: String(index) },
          renderItem?.({ item, index }),
        ),
      );
      const empty =
        data.length === 0
          ? typeof ListEmptyComponent === 'function'
            ? React.createElement(ListEmptyComponent)
            : (ListEmptyComponent ?? null)
          : null;
      return React.createElement('View', props, header, ...items, empty);
    },
  ),
}));
jest.mock('@app/components/LiveStreamCard/LiveStreamCard', () => ({
  MemoizedLiveStreamCard: ({ stream }: { stream: { user_name: string } }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, stream.user_name);
  },
}));
jest.mock('@app/components/ScreenHeader/ScreenHeader', () => ({
  ScreenHeader: ({
    title,
    children,
  }: {
    title: string;
    children?: React.ReactNode;
  }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, title),
      children,
    );
  },
}));
jest.mock('@app/components/LoadingState/LoadingState', () => ({
  LoadingState: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'loading-state' });
  },
}));
jest.mock('@app/utils/sharing/shareDeepLink', () => ({
  shareDeepLink: jest.fn(),
}));

const useCategoryQuery = jest.mocked(_useCategoryQuery);
const useStreamsByCategoryQuery = jest.mocked(_useStreamsByCategoryQuery);

const mockCategory = {
  id: 'cat1',
  name: 'Just Chatting',
  box_art_url: 'https://example.com/art.jpg',
};

const mockStream = {
  id: '1',
  user_id: '100',
  user_login: 'streamer1',
  user_name: 'Streamer1',
  game_id: 'cat1',
  game_name: 'Just Chatting',
  type: 'live' as const,
  title: 'Test stream',
  viewer_count: 10000,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: '',
  tag_ids: [],
  tags: [],
  is_mature: false,
};

const baseStreamsResult = {
  data: undefined,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
  hasNextPage: false,
  isLoading: false,
  isError: false,
  isFetchingNextPage: false,
} as unknown as ReturnType<typeof _useStreamsByCategoryQuery>;

const baseCategoryResult = {
  data: undefined,
  isLoading: false,
  isError: false,
} as unknown as ReturnType<typeof _useCategoryQuery>;

describe('CategoryScreen', () => {
  test('shows loading state while category or streams are loading', () => {
    useCategoryQuery.mockReturnValue(
      Object.assign({}, baseCategoryResult, { isLoading: true }),
    );
    useStreamsByCategoryQuery.mockReturnValue(baseStreamsResult);

    render(<CategoryScreen id='cat1' />);

    expect(screen.getByTestId('loading-state')).toBeTruthy();
  });

  test('shows error empty state when category fetch fails', () => {
    useCategoryQuery.mockReturnValue(
      Object.assign({}, baseCategoryResult, { isError: true }),
    );
    useStreamsByCategoryQuery.mockReturnValue(baseStreamsResult);

    render(<CategoryScreen id='cat1' />);

    expect(screen.getByText('Failed to fetch categories')).toBeTruthy();
  });

  test('shows error empty state when streams fetch fails', () => {
    useCategoryQuery.mockReturnValue(
      Object.assign({}, baseCategoryResult, { data: mockCategory }),
    );
    useStreamsByCategoryQuery.mockReturnValue(
      Object.assign({}, baseStreamsResult, { isError: true }),
    );

    render(<CategoryScreen id='cat1' />);

    expect(screen.getByText('Failed to fetch categories')).toBeTruthy();
  });

  test('renders category name and streams when data is available', () => {
    useCategoryQuery.mockReturnValue(
      Object.assign({}, baseCategoryResult, { data: mockCategory }),
    );
    useStreamsByCategoryQuery.mockReturnValue(
      Object.assign({}, baseStreamsResult, {
        data: { pages: [{ data: [mockStream] }], pageParams: [] },
      }),
    );

    render(<CategoryScreen id='cat1' />);

    expect(screen.getByText('Just Chatting')).toBeTruthy();
    expect(screen.getByText('Streamer1')).toBeTruthy();
  });

  test('shows empty state when no streams for category', () => {
    useCategoryQuery.mockReturnValue(baseCategoryResult);
    useStreamsByCategoryQuery.mockReturnValue(
      Object.assign({}, baseStreamsResult, {
        data: { pages: [{ data: [] }], pageParams: [] },
      }),
    );

    render(<CategoryScreen id='cat1' />);

    expect(screen.getByText('No Top Streams found')).toBeTruthy();
  });
});
