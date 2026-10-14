import type { ComponentType, Ref } from 'react';

import { requireNativeView } from 'expo';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type {
  NativeChatListViewHandle,
  NativeChatListViewProps,
} from './NativeChatList.types';

export const isNativeChatListAvailable =
  requireOptionalNativeModule('NativeChatList') != null;

type NativeChatListViewComponent = ComponentType<
  NativeChatListViewProps & { ref?: Ref<NativeChatListViewHandle> }
>;

export const NativeChatListView: NativeChatListViewComponent | null =
  isNativeChatListAvailable ? requireNativeView('NativeChatList') : null;
