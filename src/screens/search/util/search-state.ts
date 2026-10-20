import type { Category } from '@app/types/twitch/category';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

export type SearchFilter = 'channels' | 'categories';

export type SearchStatus = 'idle' | 'searching' | 'done' | 'error';

export type SearchItem = SearchChannelResponse | Category;

export type SearchState = {
  query: string;
  selectedFilter: SearchFilter;
  searchResults: SearchChannelResponse[];
  categoryResults: Category[];
  status: SearchStatus;
};

export const SEARCH_INITIAL_STATE: SearchState = {
  query: '',
  selectedFilter: 'channels',
  searchResults: [],
  categoryResults: [],
  status: 'idle',
};

export const MIN_SEARCH_QUERY_LENGTH = 2;

export function isSearchChannelItem(
  item: SearchItem,
): item is SearchChannelResponse {
  return 'broadcaster_login' in item;
}

export function getSearchResultKey(item: SearchItem) {
  return isSearchChannelItem(item)
    ? `channel-${item.id}`
    : `category-${item.id}`;
}
