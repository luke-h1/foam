import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { twitchService as _twitchService } from '@app/services/twitch-service';
import { storageService as _storageService } from '@app/lib/storage';
import { SearchScreen } from '../SearchScreen';

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    searchChannels: jest.fn(),
    searchCategories: jest.fn(),
  },
}));

jest.mock('@app/lib/storage', () => ({
  storageService: {
    getString: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn(),
    events: { on: jest.fn(), off: jest.fn() },
  },
}));

jest.mock('@app/hooks/useScrollToTop', () => ({ useScrollToTop: jest.fn() }));
jest.mock('@app/hooks/useDebouncedCallback', () => ({
  useDebouncedCallback: (fn: unknown) => [fn],
}));
jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(),
  OrientationLock: { PORTRAIT_UP: 'PORTRAIT_UP' },
}));
jest.mock('@app/components/FlashList/FlashList', () => ({
  FlashList: jest.requireMock('@shopify/flash-list').FlashList,
}));
jest.mock('@app/components/SegmentedControl/SegmentedControl', () => ({
  SegmentedControl: ({
    items,
    onChange,
  }: {
    items: { label: string }[];
    onChange: (index: number) => void;
  }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      View,
      null,
      items.map(({ label }: { label: string }, i: number) =>
        React.createElement(
          TouchableOpacity,
          {
            key: label,
            testID: `filter-${label.toLowerCase()}`,
            onPress: () => onChange(i),
          },
          React.createElement(Text, null, label),
        ),
      ),
    );
  },
}));
jest.mock('@app/components/ui/SearchHistory/SearchHistoryV2', () => ({
  SearchHistoryV2: ({
    history,
    onSelectItem,
  }: {
    history: string[];
    onSelectItem: (q: string) => void;
  }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'search-history' },
      history.map((q: string) =>
        React.createElement(
          TouchableOpacity,
          { key: q, onPress: () => onSelectItem(q), testID: `history-${q}` },
          React.createElement(Text, null, q),
        ),
      ),
    );
  },
}));
jest.mock('../components/StreamerCard', () => ({
  StreamerCard: ({ stream }: { stream: { display_name: string } }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, stream.display_name);
  },
}));
jest.mock('@app/components/Image/Image', () => ({ Image: () => null }));
jest.mock('expo-router', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  const SearchBar = React.forwardRef(
    (
      {
        placeholder,
        onChangeText,
      }: {
        placeholder?: string;
        onChangeText?: (e: unknown) => void;
      },
      ref: React.Ref<unknown>,
    ) =>
      React.createElement(TextInput, {
        ref,
        testID: 'search-input',
        placeholder,
        onChangeText: (text: string) =>
          onChangeText?.({ nativeEvent: { text } }),
      }),
  );
  return {
    __esModule: true,
    router: {
      back: jest.fn(),
      navigate: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      setParams: jest.fn(),
    },
    Stack: {
      Screen: () => null,
      SearchBar,
    },
    useLocalSearchParams: jest.fn(() => ({})),
    useNavigation: jest.fn(() => ({
      addListener: jest.fn(() => jest.fn()),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    })),
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => ({
      back: jest.fn(),
      navigate: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      setParams: jest.fn(),
    })),
  };
});

const twitchService = jest.mocked(_twitchService);
const storageService = jest.mocked(_storageService);

const mockChannel = {
  id: 'ch1',
  broadcaster_login: 'streamer1',
  broadcaster_language: 'en',
  display_name: 'Streamer1',
  game_id: '509658',
  game_name: 'Just Chatting',
  is_live: true,
  tag_ids: [],
  tags: [],
  thumbnail_url: 'https://example.com/thumb.jpg',
  title: 'Test stream',
  started_at: new Date().toISOString(),
};

const mockCategoryResult = {
  id: 'cat1',
  name: 'Just Chatting',
  box_art_url: 'https://example.com/art.jpg',
};

describe('SearchScreen', () => {
  beforeEach(() => {
    twitchService.searchChannels.mockResolvedValue([mockChannel]);
    twitchService.searchCategories.mockResolvedValue({
      data: [mockCategoryResult],
    });
  });

  test('renders search input', () => {
    render(<SearchScreen />);

    expect(screen.getByTestId('search-input')).toBeTruthy();
  });

  test('shows quick action chips before a search is made', () => {
    render(<SearchScreen />);

    expect(screen.getByText('Just Chatting')).toBeTruthy();
    expect(screen.getByText('Valorant')).toBeTruthy();
  });

  test('shows channel results after searching', async () => {
    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'stre');

    await waitFor(() => {
      expect(screen.getByText('Streamer1')).toBeTruthy();
    });
  });

  test('shows category results when categories filter is active', async () => {
    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'just');

    await waitFor(() => {
      expect(twitchService.searchCategories).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId('filter-categories')); // label is "Categories"

    expect(screen.getByText('Just Chatting')).toBeTruthy();
  });

  test('does not search when query is shorter than 2 chars', async () => {
    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 's');

    await waitFor(() => {
      expect(twitchService.searchChannels).not.toHaveBeenCalled();
    });
  });

  test('shows search history when available and no query entered', () => {
    storageService.getString.mockReturnValue([
      { query: 'xqc', date: new Date().toISOString() },
    ]);

    render(<SearchScreen />);

    expect(screen.getByTestId('search-history')).toBeTruthy();
    expect(screen.getByText('xqc')).toBeTruthy();
  });
});
