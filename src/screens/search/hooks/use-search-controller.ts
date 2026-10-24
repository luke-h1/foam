import {
  startTransition,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { router, useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

import type { FlashListRef } from '@app/components/flash-list/flash-list';
import { useDebouncedCallback } from '@app/hooks/use-debounced-callback';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { storageService } from '@app/lib/storage';
import { twitchService } from '@app/services/twitch-service';
import type { Category } from '@app/types/twitch/category';
import type { SearchChannelResponse } from '@app/types/twitch/channel';
import { logger } from '@app/utils/logger';

import type { SearchInputBarHandle } from '../components/search-input-bar/types';
import {
  getSearchHistorySnapshot,
  SEARCH_HISTORY_STORAGE_KEY,
  type SearchHistoryItem,
  sortSearchHistory,
  subscribeToSearchHistory,
  writeSearchHistoryQuery,
} from '../util/search-history';
import {
  MIN_SEARCH_QUERY_LENGTH,
  SEARCH_INITIAL_STATE,
  type SearchItem,
  type SearchState,
} from '../util/search-state';

export function useSearchController() {
  const [
    { query, selectedFilter, searchResults, categoryResults, status },
    setState,
  ] = useState<SearchState>(SEARCH_INITIAL_STATE);

  const listRef = useRef<FlashListRef<SearchItem>>(null);
  const searchBarRef = useRef<SearchInputBarHandle | null>(null);

  useScrollToTop(listRef);

  const searchHistorySnapshot = useSyncExternalStore(
    subscribeToSearchHistory,
    getSearchHistorySnapshot,
    getSearchHistorySnapshot,
  );

  const searchHistory = useMemo(() => {
    const storedHistory: SearchHistoryItem[] = JSON.parse(
      searchHistorySnapshot,
    );
    return sortSearchHistory(storedHistory);
  }, [searchHistorySnapshot]);

  const searchHistoryQueries = useMemo(
    () => searchHistory.map(item => item.query),
    [searchHistory],
  );

  // Lock portrait only while search is focused. A mount lock can finish after
  // the player unlocks and keep the stream in portrait.
  useFocusEffect(
    useCallback(() => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    }, []),
  );

  const performSearch = useCallback(async (value: string) => {
    if (value.length < MIN_SEARCH_QUERY_LENGTH) {
      startTransition(() => {
        setState(state => ({
          ...state,
          searchResults: [],
          categoryResults: [],
          status: 'idle',
        }));
      });

      return;
    }

    setState(state => ({ ...state, status: 'searching' }));

    let channelResults: SearchChannelResponse[];
    let categories: Category[];

    try {
      const [channels, categoryResponse] = await Promise.all([
        twitchService.searchChannels(value),
        twitchService.searchCategories(value),
      ]);

      channelResults = channels;
      categories = categoryResponse.data.slice(0, 10);
    } catch (error) {
      logger.twitch.error('Search failed', error);
      setState(state => ({ ...state, status: 'error' }));
      return;
    }

    startTransition(() => {
      setState(state => ({
        ...state,
        searchResults: channelResults,
        categoryResults: categories,
        status: 'done',
      }));
    });

    writeSearchHistoryQuery(value);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [search] = useDebouncedCallback(performSearch, 400);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      return Promise.resolve();
    }

    setIsRefreshing(true);
    return performSearch(normalizedQuery).finally(() => setIsRefreshing(false));
  }, [performSearch, query]);

  const handleClearSearch = useCallback(() => {
    searchBarRef.current?.clearText();

    startTransition(() => {
      setState(state => ({
        ...state,
        query: '',
        searchResults: [],
        categoryResults: [],
        status: 'idle',
      }));
    });
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    router.push(`/category/${categoryId}`);
  }, []);

  const handleQuerySearch = useCallback(
    async (searchQuery: string) => {
      await search(searchQuery);
    },
    [search],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      const normalizedText = text.trim();
      const willSearch = normalizedText.length > MIN_SEARCH_QUERY_LENGTH;

      setState(state => ({
        ...state,
        query: text,
        status: willSearch ? 'searching' : state.status,
      }));

      if (willSearch) {
        void handleQuerySearch(normalizedText);
      } else if (normalizedText.length === 0) {
        startTransition(() => {
          setState(state => ({
            ...state,
            searchResults: [],
            categoryResults: [],
            status: 'idle',
          }));
        });
      }
    },
    [handleQuerySearch],
  );

  const handleSearchSubmit = useCallback(
    (text: string) => {
      const searchText = text.trim();
      if (searchText.length > 0) {
        void handleQuerySearch(searchText);
      }
    },
    [handleQuerySearch],
  );

  const handleSearchHistorySelect = useCallback(
    (historyQuery: string) => {
      searchBarRef.current?.setText(historyQuery);

      setState(state => ({
        ...state,
        query: historyQuery,
        status: 'searching',
      }));

      void handleQuerySearch(historyQuery);
    },
    [handleQuerySearch],
  );

  const handleSearchHistoryClearAll = useCallback(() => {
    storageService.remove(SEARCH_HISTORY_STORAGE_KEY);
  }, []);

  const handleSearchHistoryClearItem = useCallback(
    (historyQuery: string) => {
      const newHistory = searchHistory.filter(
        item => item.query !== historyQuery,
      );
      storageService.set(SEARCH_HISTORY_STORAGE_KEY, newHistory);
    },
    [searchHistory],
  );

  const handleFilterChange = useCallback((index: number) => {
    startTransition(() => {
      setState(state => ({
        ...state,
        selectedFilter: index === 0 ? 'channels' : 'categories',
      }));
    });
  }, []);

  const activeResults =
    selectedFilter === 'channels' ? searchResults : categoryResults;

  return {
    activeResults,
    handleCategoryPress,
    handleClearSearch,
    handleFilterChange,
    handleQuerySearch,
    handleRefresh,
    handleSearchHistoryClearAll,
    handleSearchHistoryClearItem,
    handleSearchHistorySelect,
    handleSearchSubmit,
    handleTextChange,
    isRefreshing,
    listRef,
    query,
    searchBarRef,
    searchHistoryQueries,
    searchResults,
    selectedFilter,
    status,
  };
}
