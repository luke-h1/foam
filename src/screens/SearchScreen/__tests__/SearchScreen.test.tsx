import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { storageService as _storageService } from '@app/lib/storage';
import { twitchService as _twitchService } from '@app/services/twitch-service';

import { SearchScreen } from '../SearchScreen';

jest.mock('@app/services/twitch-service');

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
// SegmentedControl wraps the native @expo/ui control, which cannot receive
// segment-change events in tests; expose each segment as a pressable instead.
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

    expect(screen.getByTestId('search-input')).toBeOnTheScreen();
  });

  test('shows quick action chips before a search is made', () => {
    render(<SearchScreen />);

    expect(screen.getByText('Just Chatting')).toBeOnTheScreen();
    expect(screen.getByText('Valorant')).toBeOnTheScreen();
  });

  test('shows channel results after searching', async () => {
    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'stre');

    await waitFor(() => {
      expect(screen.getByText('Streamer1')).toBeOnTheScreen();
    });
  });

  test('shows category results when categories filter is active', async () => {
    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'just');

    await waitFor(() => {
      expect(twitchService.searchCategories).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId('filter-categories'));

    expect(screen.getByText('Just Chatting')).toBeOnTheScreen();
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

    expect(screen.getByText('RECENT SEARCHES')).toBeOnTheScreen();
    expect(screen.getByText('xqc')).toBeOnTheScreen();
  });
});
