import { createElement } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import * as SegmentedControlModule from '@app/components/SegmentedControl/SegmentedControl';
import * as useDebouncedCallbackModule from '@app/hooks/useDebouncedCallback';
import { storageService as realStorageService } from '@app/lib/storage';
import { twitchService as realTwitchService } from '@app/services/twitch-service';
import type { Category } from '@app/types/twitch/category';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

import { SearchScreen } from '../SearchScreen';

const twitchService = {
  searchChannels: jest.spyOn(realTwitchService, 'searchChannels'),
  searchCategories: jest.spyOn(realTwitchService, 'searchCategories'),
};

const storageService = {
  getString: jest.spyOn(realStorageService, 'getString').mockReturnValue(null),
  set: jest.spyOn(realStorageService, 'set').mockImplementation(() => {}),
  remove: jest.spyOn(realStorageService, 'remove').mockImplementation(() => {}),
};
jest.spyOn(realStorageService.events, 'on').mockReturnThis();
jest.spyOn(realStorageService.events, 'off').mockReturnThis();

jest
  .spyOn(useDebouncedCallbackModule, 'useDebouncedCallback')
  .mockImplementation((callback: (...args: unknown[]) => void) => [
    (...args: unknown[]) => {
      callback(...args);
      return Promise.resolve();
    },
    () => {},
  ]);

// The native @expo/ui SegmentedControl cannot receive segment-change events in tests; expose each segment as a pressable.
jest
  .spyOn(SegmentedControlModule, 'SegmentedControl')
  .mockImplementation(({ items, onChange }) =>
    createElement(
      View,
      null,
      items.map(({ label }, i) =>
        createElement(
          TouchableOpacity,
          {
            key: label,
            testID: `filter-${label.toLowerCase()}`,
            onPress: () => onChange(i),
          },
          createElement(Text, null, label),
        ),
      ),
    ),
  );

const mockChannel: SearchChannelResponse = {
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

const mockCategoryResult: Category = {
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

  test('quick-action tap fires exactly one search', async () => {
    render(<SearchScreen />);

    fireEvent.press(screen.getByText('Just Chatting'));

    await waitFor(() => {
      expect(twitchService.searchCategories).toHaveBeenCalledTimes(1);
    });
    // The imperative setText handle must not re-enter type-to-search, or one tap issues the same query twice.
    expect(twitchService.searchChannels).toHaveBeenCalledTimes(1);
  });

  test('shows search history when available and no query entered', () => {
    storageService.getString.mockReturnValue([
      { query: 'xqc', date: new Date().toISOString() },
    ]);

    render(<SearchScreen />);

    // Native @expo/ui history rows carry text as props, not findable Text nodes; query by testID.
    expect(screen.getByTestId('search-history')).toBeOnTheScreen();
    expect(screen.getByTestId('search-history-item-xqc')).toBeOnTheScreen();
  });
});
