import { storageService } from '@app/lib/storage';

export type SearchHistoryItem = {
  query: string;
  date: string;
};

export const SEARCH_HISTORY_STORAGE_KEY = 'previous_searches';

export function sortSearchHistory(history: SearchHistoryItem[]) {
  // eslint-disable-next-line react-doctor/js-tosorted-immutable -- Hermes lacks toSorted
  return [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function getStoredSearchHistory() {
  return (
    storageService.getString<SearchHistoryItem[]>(SEARCH_HISTORY_STORAGE_KEY) ??
    []
  );
}

export function getSearchHistorySnapshot() {
  return JSON.stringify(getStoredSearchHistory());
}

export function subscribeToSearchHistory(onStoreChange: () => void) {
  const handleStorageChange = (key: string) => {
    if (key === SEARCH_HISTORY_STORAGE_KEY || key === 'all') {
      onStoreChange();
    }
  };

  storageService.events.on('storageChange', handleStorageChange);

  return () => {
    storageService.events.off('storageChange', handleStorageChange);
  };
}

export function writeSearchHistoryQuery(query: string) {
  const previousSearches = getStoredSearchHistory();
  const updatedAt = new Date().toISOString();
  const nextSearches: SearchHistoryItem[] = [];
  let hasExistingQuery = false;

  for (const item of previousSearches) {
    if (item.query === query) {
      nextSearches.push({ query: item.query, date: updatedAt });
      hasExistingQuery = true;
      continue;
    }

    nextSearches.push(item);
  }

  if (!hasExistingQuery) {
    nextSearches.push({ query, date: updatedAt });
  }

  storageService.set(
    SEARCH_HISTORY_STORAGE_KEY,
    sortSearchHistory(nextSearches),
  );
}
