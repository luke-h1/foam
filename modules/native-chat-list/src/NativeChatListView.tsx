import type { ComponentType, Ref } from 'react';

import type {
  NativeChatListViewHandle,
  NativeChatListViewProps,
} from './NativeChatList.types';

// The native list is iOS only; every other platform keeps the React chat list.
export const isNativeChatListAvailable = false;

type NativeChatListViewComponent = ComponentType<
  NativeChatListViewProps & { ref?: Ref<NativeChatListViewHandle> }
>;

export const NativeChatListView: NativeChatListViewComponent | null = null;
