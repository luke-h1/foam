import { render, screen } from '@testing-library/react-native';
import { useTopCategoriesQuery as _useTopCategoriesQuery } from '@app/hooks/queries/use-top-categories-query';
import { TopCategoriesScreen } from '../TopCategoriesScreen';

jest.mock('@app/hooks/queries/use-top-categories-query');
jest.mock('@app/hooks/useScrollToTop', () => ({ useScrollToTop: jest.fn() }));
jest.mock('@app/hooks/useRefetchOnForeground', () => ({
  useRefetchOnForeground: jest.fn(),
}));
jest.mock('@app/hooks/useInfiniteQueryLoadMore', () => ({
  useInfiniteQueryLoadMore: jest.fn(() => jest.fn()),
}));
jest.mock('@legendapp/state/react', () => ({
  useObservable: (initial: unknown) => ({
    get: () => initial,
    set: jest.fn(),
    peek: () => initial,
  }),
  useSelector: (obs: { get: () => unknown }) => obs.get(),
}));
jest.mock('@app/components/FlashList/AnimatedFlashList', () => ({
  AnimatedFlashList: jest.requireMock('@shopify/flash-list').FlashList,
}));
jest.mock('@app/components/FlashList/FlashList', () => ({
  FlashList: jest.requireMock('@shopify/flash-list').FlashList,
}));
jest.mock('@app/components/CategoryCard/CategoryCard', () => ({
  CATEGORY_CARD_HEIGHT: 200,
  MemoizedCategoryCard: ({ category }: { category: { name: string } }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, category.name);
  },
}));
jest.mock('@app/components/ui/Skeleton/Skeleton', () => ({
  Skeleton: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'skeleton' });
  },
}));

const useTopCategoriesQuery = jest.mocked(_useTopCategoriesQuery);

const mockRefetch = jest.fn();
const mockFetchNextPage = jest.fn();

const baseQueryResult = {
  data: undefined,
  fetchNextPage: mockFetchNextPage,
  refetch: mockRefetch,
  hasNextPage: false,
  isLoading: false,
  isFetching: false,
  isError: false,
  isFetchingNextPage: false,
} as unknown as ReturnType<typeof _useTopCategoriesQuery>;

const mockCategory = {
  id: 'cat1',
  name: 'Just Chatting',
  box_art_url: 'https://example.com/art.jpg',
};

describe('TopCategoriesScreen', () => {
  test('shows skeleton while loading', () => {
    useTopCategoriesQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, { isLoading: true }),
    );

    render(<TopCategoriesScreen />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('renders category list when data is available', () => {
    useTopCategoriesQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, {
        data: { pages: [{ data: [mockCategory] }], pageParams: [] },
      }),
    );

    render(<TopCategoriesScreen />);

    expect(screen.getByText('Just Chatting')).toBeTruthy();
  });

  test('shows error empty state when fetch fails', () => {
    useTopCategoriesQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, { isError: true }),
    );

    render(<TopCategoriesScreen />);

    expect(screen.getByText('Failed to fetch top categories')).toBeTruthy();
  });

  test('shows empty state when no categories returned', () => {
    useTopCategoriesQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, {
        data: { pages: [{ data: [] }], pageParams: [] },
      }),
    );

    render(<TopCategoriesScreen />);

    expect(screen.getByText('No categories found')).toBeTruthy();
  });

  test('renders multiple categories', () => {
    useTopCategoriesQuery.mockReturnValue(
      Object.assign({}, baseQueryResult, {
        data: {
          pages: [
            {
              data: [
                mockCategory,
                { id: 'cat2', name: 'Fortnite', box_art_url: '' },
              ],
            },
          ],
          pageParams: [],
        },
      }),
    );

    render(<TopCategoriesScreen />);

    expect(screen.getByText('Just Chatting')).toBeTruthy();
    expect(screen.getByText('Fortnite')).toBeTruthy();
  });
});
