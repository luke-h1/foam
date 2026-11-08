import { act, fireEvent, screen } from '@testing-library/react-native';

import { storageService } from '@app/lib/storage';
import { createCategory } from '@app/services/__fixtures__/twitch/category.fixture';
import { createTwitchStream } from '@app/services/__fixtures__/twitch/stream.fixture';
import { twitchService as realTwitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

import { SearchScreen } from '../SearchScreen';
import {
  SEARCH_HISTORY_STORAGE_KEY,
  type SearchHistoryItem,
} from '../util/searchHistory';

const SEARCHED_AT = '2026-10-14T12:00:00.400Z';

const twitchService = {
  searchChannels: jest.spyOn(realTwitchService, 'searchChannels'),
  searchCategories: jest.spyOn(realTwitchService, 'searchCategories'),
  getTopStreams: jest.spyOn(realTwitchService, 'getTopStreams'),
  getTopCategories: jest.spyOn(realTwitchService, 'getTopCategories'),
};

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

const mockCategoryResult = createCategory({
  box_art_url: 'https://example.com/art.jpg',
});

const mockRailStream = createTwitchStream({
  id: 'rail-1',
  user_id: '900',
  user_login: 'railstreamer',
  user_name: 'RailStreamer',
  game_id: '1',
  title: 'Live on the rail',
  viewer_count: 1200,
  thumbnail_url: '',
});

async function advanceTimers(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

async function typeQuery(text: string) {
  fireEvent.changeText(screen.getByTestId('search-input'), text);
  await advanceTimers(400);
}

describe('SearchScreen', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-14T12:00:00.000Z') });
    storageService.clear();

    twitchService.searchChannels.mockResolvedValue([mockChannel]);
    twitchService.searchCategories.mockResolvedValue({
      data: [mockCategoryResult],
    });
    twitchService.getTopStreams.mockResolvedValue({
      data: [mockRailStream],
      pagination: { cursor: '' },
    });
    twitchService.getTopCategories.mockResolvedValue({
      data: [
        createCategory({
          id: 'rail-cat',
          name: 'Rail Category',
          box_art_url: '',
        }),
      ],
      pagination: { cursor: '' },
    });
  });

  test('shows live channels and top categories before a search is made', async () => {
    render(<SearchScreen />);

    expect(screen.getByText('Live now')).toBeOnTheScreen();

    expect(screen.getByText('Top categories')).toBeOnTheScreen();

    await advanceTimers(0);

    expect(screen.getByText('RailStreamer')).toBeOnTheScreen();

    expect(screen.getByText('Rail Category')).toBeOnTheScreen();
  });

  test('shows channel results after searching and saves the query to history', async () => {
    render(<SearchScreen />);

    await typeQuery('stre');

    expect(screen.getByText('Streamer1')).toBeOnTheScreen();

    expect(storageService.getString(SEARCH_HISTORY_STORAGE_KEY)).toEqual<
      SearchHistoryItem[]
    >([{ query: 'stre', date: SEARCHED_AT }]);
  });

  test('shows category results when categories filter is active', async () => {
    render(<SearchScreen />);

    await typeQuery('just');

    expect(screen.getByText('Streamer1')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('segmented-control-option-Categories'));

    expect(screen.getByText('Just Chatting')).toBeOnTheScreen();

    expect(screen.queryByText('Streamer1')).not.toBeOnTheScreen();
  });

  test('does not search when query is shorter than 2 chars', async () => {
    render(<SearchScreen />);

    await typeQuery('s');

    expect(twitchService.searchChannels).not.toHaveBeenCalled();

    expect(storageService.getString(SEARCH_HISTORY_STORAGE_KEY)).toBe(null);
  });

  test('searches as soon as the typed query has 2 chars', async () => {
    render(<SearchScreen />);

    await typeQuery('st');

    expect(twitchService.searchChannels.mock.calls).toEqual([['st']]);

    expect(screen.getByText('Streamer1')).toBeOnTheScreen();
  });

  test('ignores a slow response for an older query', async () => {
    let resolveFirst: (value: SearchChannelResponse[]) => void = () => {};

    twitchService.searchChannels.mockReturnValueOnce(
      new Promise(resolve => {
        resolveFirst = resolve;
      }),
    );

    twitchService.searchChannels.mockResolvedValueOnce([
      { ...mockChannel, id: 'ch2', display_name: 'NewerStreamer' },
    ]);

    render(<SearchScreen />);

    await typeQuery('old');
    await typeQuery('new');

    expect(screen.getByText('NewerStreamer')).toBeOnTheScreen();

    await act(async () => {
      resolveFirst([{ ...mockChannel, display_name: 'OlderStreamer' }]);
    });

    expect(screen.queryByText('OlderStreamer')).not.toBeOnTheScreen();

    expect(screen.getByText('NewerStreamer')).toBeOnTheScreen();
  });

  test('shows a skeleton while a search is in flight', async () => {
    let resolveChannels: (value: SearchChannelResponse[]) => void = () => {};

    twitchService.searchChannels.mockReturnValue(
      new Promise(resolve => {
        resolveChannels = resolve;
      }),
    );

    render(<SearchScreen />);

    await typeQuery('stre');

    expect(screen.getByTestId('search-results-skeleton')).toBeOnTheScreen();

    await act(async () => {
      resolveChannels([mockChannel]);
    });

    expect(screen.getByText('Streamer1')).toBeOnTheScreen();
  });

  test('shows an empty state that echoes the query when nothing matches', async () => {
    twitchService.searchChannels.mockResolvedValue([]);
    twitchService.searchCategories.mockResolvedValue({ data: [] });

    render(<SearchScreen />);

    await typeQuery('zzzz');

    expect(screen.getByText('No channels for "zzzz"')).toBeOnTheScreen();
  });

  test('shows an error state with retry when the search fails', async () => {
    twitchService.searchChannels.mockRejectedValue(new Error('network error'));

    render(<SearchScreen />);

    await typeQuery('stre');

    expect(screen.getByText("Couldn't search")).toBeOnTheScreen();

    expect(screen.getByText('Try again')).toBeOnTheScreen();
  });

  test('shows search history when available and no query entered', () => {
    storageService.set<SearchHistoryItem[]>(SEARCH_HISTORY_STORAGE_KEY, [
      { query: 'xqc', date: '2026-10-13T12:00:00.000Z' },
    ]);

    render(<SearchScreen />);

    expect(screen.getByTestId('search-history')).toBeOnTheScreen();

    expect(screen.getByTestId('search-history-item-xqc')).toBeOnTheScreen();
  });

  test('selecting a recent search fires exactly one search and moves it to now', async () => {
    storageService.set<SearchHistoryItem[]>(SEARCH_HISTORY_STORAGE_KEY, [
      { query: 'xqc', date: '2026-10-13T12:00:00.000Z' },
    ]);

    render(<SearchScreen />);

    fireEvent.press(screen.getByTestId('search-history-item-xqc'));

    await advanceTimers(400);

    expect(screen.getByText('Streamer1')).toBeOnTheScreen();

    expect(twitchService.searchChannels).toHaveBeenCalledTimes(1);

    expect(storageService.getString(SEARCH_HISTORY_STORAGE_KEY)).toEqual<
      SearchHistoryItem[]
    >([{ query: 'xqc', date: SEARCHED_AT }]);

    // setText must not trigger type-to-search. If it does, one tap sends the
    // same query twice.
    expect(twitchService.searchCategories).toHaveBeenCalledTimes(1);
  });
});
