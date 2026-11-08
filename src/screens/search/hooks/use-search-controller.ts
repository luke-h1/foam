import {
  startTransition,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { router, useFocusEffect } from 'expo-router';

import type { FlashListRef } from '@app/components/flash-list/FlashList';
import { useDebouncedCallback } from '@app/hooks/use-debounced-callback';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { twitchService } from '@app/services/twitch-service';
import type { Category } from '@app/types/twitch/category';
import type { SearchChannelResponse } from '@app/types/twitch/channel';
import { lockPortrait } from '@app/utils/device/lockPortrait';
import { logger } from '@app/utils/logger';

import type { SearchInputBarHandle } from '../components/search-input-bar/types';
import {
  clearSearchHistory,
  getSearchHistorySnapshot,
  removeSearchHistoryQuery,
  type SearchHistoryItem,
  sortSearchHistory,
  subscribeToSearchHistory,
  writeSearchHistoryQuery,
} from '../util/searchHistory';
import {
  isQueryLongEnough,
  SEARCH_INITIAL_STATE,
  type SearchItem,
  type SearchState,
} from '../util/searchState';

export function useSearchController() {
  const [
    { query, selectedFilter, searchResults, categoryResults, status },
    setState,
  ] = useState<SearchState>(SEARCH_INITIAL_STATE);

  const listRef = useRef<FlashListRef<SearchItem>>(null);

  const searchRequestIdRef = useRef(0);
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
      lockPortrait();
    }, []),
  );

  const performSearch = useCallback(async (value: string) => {
    searchRequestIdRef.current += 1;
    const requestId = searchRequestIdRef.current;

    if (!isQueryLongEnough(value)) {
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

      if (requestId === searchRequestIdRef.current) {
        setState(state => ({ ...state, status: 'error' }));
      }

      return;
    }

    if (requestId !== searchRequestIdRef.current) {
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

  const [search, cancelPendingSearch] = useDebouncedCallback(
    performSearch,
    400,
  );

  const discardSearch = useCallback(() => {
    cancelPendingSearch();
    searchRequestIdRef.current += 1;
  }, [cancelPendingSearch]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    const normalizedQuery = query.trim();

    if (!isQueryLongEnough(normalizedQuery)) {
      return Promise.resolve();
    }

    setIsRefreshing(true);
    return performSearch(normalizedQuery).finally(() => setIsRefreshing(false));
  }, [performSearch, query]);

  const handleClearSearch = useCallback(() => {
    searchBarRef.current?.clearText();
    discardSearch();

    startTransition(() => {
      setState(state => ({
        ...state,
        query: '',
        searchResults: [],
        categoryResults: [],
        status: 'idle',
      }));
    });
  }, [discardSearch]);

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
      const willSearch = isQueryLongEnough(normalizedText);

      setState(state => ({
        ...state,
        query: text,
        status: willSearch ? 'searching' : state.status,
      }));

      if (willSearch) {
        void handleQuerySearch(normalizedText);
      } else if (normalizedText.length === 0) {
        discardSearch();

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
    [discardSearch, handleQuerySearch],
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

  const handleSearchHistoryClearAll = clearSearchHistory;
  const handleSearchHistoryClearItem = removeSearchHistoryQuery;

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
