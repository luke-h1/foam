import { createElement } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import * as SegmentedControlModule from '@app/components/segmented-control/segmented-control';
import * as useDebouncedCallbackModule from '@app/hooks/use-debounced-callback';
import { storageService as realStorageService } from '@app/lib/storage';
import { twitchService as realTwitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { Category } from '@app/types/twitch/category';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

import { SearchScreen } from '../search-screen';

const twitchService = {
  searchChannels: jest.spyOn(realTwitchService, 'searchChannels'),
  searchCategories: jest.spyOn(realTwitchService, 'searchCategories'),
  getTopStreams: jest.spyOn(realTwitchService, 'getTopStreams'),
  getTopCategories: jest.spyOn(realTwitchService, 'getTopCategories'),
  getUserImage: jest.spyOn(realTwitchService, 'getUserImage'),
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

const mockRailStream = {
  id: 'rail-1',
  user_id: '900',
  user_login: 'railstreamer',
  user_name: 'RailStreamer',
  game_id: '1',
  game_name: 'Just Chatting',
  type: 'live' as const,
  title: 'Live on the rail',
  viewer_count: 1200,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: '',
  tag_ids: [],
  tags: [],
  is_mature: false,
};

describe('SearchScreen', () => {
  beforeEach(() => {
    twitchService.searchChannels.mockResolvedValue([mockChannel]);
    twitchService.searchCategories.mockResolvedValue({
      data: [mockCategoryResult],
    });
    twitchService.getTopStreams.mockResolvedValue({
      data: [
        {
          ...mockRailStream,
        },
      ],
      pagination: { cursor: '' },
    });
    twitchService.getTopCategories.mockResolvedValue({
      data: [{ id: 'rail-cat', name: 'Rail Category', box_art_url: '' }],
      pagination: { cursor: '' },
    });
    twitchService.getUserImage.mockResolvedValue('');
  });

  test('renders search input', () => {
    render(<SearchScreen />);

    expect(screen.getByTestId('search-input')).toBeOnTheScreen();
  });

  test('shows live channels and top categories before a search is made', async () => {
    render(<SearchScreen />);

    expect(screen.getByText('Live now')).toBeOnTheScreen();
    expect(screen.getByText('Top categories')).toBeOnTheScreen();
    expect(await screen.findByText('RailStreamer')).toBeOnTheScreen();
    expect(await screen.findByText('Rail Category')).toBeOnTheScreen();
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

  test('shows a skeleton while a search is in flight', async () => {
    let resolveChannels: (value: SearchChannelResponse[]) => void = () => {};

    twitchService.searchChannels.mockReturnValue(
      new Promise(resolve => {
        resolveChannels = resolve;
      }),
    );

    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'stre');

    expect(screen.getByTestId('search-results-skeleton')).toBeOnTheScreen();

    resolveChannels([mockChannel]);

    await waitFor(() => {
      expect(screen.getByText('Streamer1')).toBeOnTheScreen();
    });
  });

  test('shows an empty state that echoes the query when nothing matches', async () => {
    twitchService.searchChannels.mockResolvedValue([]);
    twitchService.searchCategories.mockResolvedValue({ data: [] });

    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'zzzz');

    expect(await screen.findByText('No channels for "zzzz"')).toBeOnTheScreen();
  });

  test('shows an error state with retry when the search fails', async () => {
    twitchService.searchChannels.mockRejectedValue(new Error('network error'));

    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'stre');

    expect(await screen.findByText("Couldn't search")).toBeOnTheScreen();
    expect(screen.getByText('Try again')).toBeOnTheScreen();
  });

  test('shows search history when available and no query entered', () => {
    storageService.getString.mockReturnValue([
      { query: 'xqc', date: new Date().toISOString() },
    ]);

    render(<SearchScreen />);

    expect(screen.getByTestId('search-history')).toBeOnTheScreen();
    expect(screen.getByTestId('search-history-item-xqc')).toBeOnTheScreen();
  });

  test('selecting a recent search fires exactly one search', async () => {
    storageService.getString.mockReturnValue([
      { query: 'xqc', date: new Date().toISOString() },
    ]);

    render(<SearchScreen />);

    fireEvent.press(screen.getByTestId('search-history-item-xqc'));

    await waitFor(() => {
      expect(twitchService.searchChannels).toHaveBeenCalledTimes(1);
    });

    // setText must not trigger type-to-search. If it does, one tap sends the
    // same query twice.
    expect(twitchService.searchCategories).toHaveBeenCalledTimes(1);
  });
});
