import type {
  Category,
  SearchChannelResponse,
} from '@app/services/twitch-service';

export interface SearchHistoryItem {
  query: string;
  date: string;
}

export type SearchFilter = 'channels' | 'categories';

export type SearchScreenState = {
  categoryResults: Category[];
  query: string;
  searchHistory: SearchHistoryItem[];
  searchResults: SearchChannelResponse[];
  selectedFilter: SearchFilter;
};

export type SearchScreenAction =
  | { type: 'setQuery'; query: string }
  | { type: 'setFilter'; selectedFilter: SearchFilter }
  | { type: 'setHistory'; searchHistory: SearchHistoryItem[] }
  | {
      type: 'setResults';
      categoryResults: Category[];
      searchResults: SearchChannelResponse[];
    }
  | { type: 'clearResults' }
  | { type: 'clearSearch' };

export const initialSearchScreenState: SearchScreenState = {
  categoryResults: [],
  query: '',
  searchHistory: [],
  searchResults: [],
  selectedFilter: 'channels',
};

export function searchScreenReducer(
  state: SearchScreenState,
  action: SearchScreenAction,
): SearchScreenState {
  switch (action.type) {
    case 'setQuery':
      return { ...state, query: action.query };
    case 'setFilter':
      return { ...state, selectedFilter: action.selectedFilter };
    case 'setHistory':
      return { ...state, searchHistory: action.searchHistory };
    case 'setResults':
      return {
        ...state,
        categoryResults: action.categoryResults,
        searchResults: action.searchResults,
      };
    case 'clearResults':
      return { ...state, categoryResults: [], searchResults: [] };
    case 'clearSearch':
      return {
        ...state,
        categoryResults: [],
        query: '',
        searchResults: [],
      };
    default:
      return state;
  }
}
