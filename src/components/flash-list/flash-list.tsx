import { type Ref, useMemo } from 'react';
import { Platform, RefreshControl } from 'react-native';

import {
  FlashList as ShopifyFlashList,
  type FlashListProps as ShopifyFlashListProps,
  type FlashListRef,
  type ListRenderItem,
} from '@shopify/flash-list';

import { theme } from '@app/styles/themes';
import { omitUndefined } from '@app/types/eopt';

export type { FlashListRef, ListRenderItem };

export type FlashListProps<TItem = unknown> = ShopifyFlashListProps<TItem> & {
  inverted?: boolean;
  onRefresh?: () => void;
};

export function FlashList<TItem>({
  onRefresh,
  ref,
  refreshControl,
  refreshing = false,
  ...props
}: FlashListProps<TItem> & { ref?: Ref<FlashListRef<TItem>> }) {
  const themedRefreshControl = useMemo(() => {
    if (!onRefresh || refreshControl) {
      return null;
    }

    if (Platform.OS === 'android') {
      return (
        <RefreshControl
          refreshing={Boolean(refreshing)}
          onRefresh={onRefresh}
          colors={[theme.colorPrimary]}
          progressBackgroundColor={theme.color.backgroundSecondary.dark}
        />
      );
    }

    return (
      <RefreshControl
        refreshing={Boolean(refreshing)}
        onRefresh={onRefresh}
        tintColor={theme.color.text.dark}
      />
    );
  }, [onRefresh, refreshControl, refreshing]);

  const activeRefreshControl = themedRefreshControl ?? refreshControl;

  return (
    <ShopifyFlashList
      {...omitUndefined({
        ref,
        refreshControl: activeRefreshControl ?? undefined,
        refreshing: activeRefreshControl ? undefined : refreshing,
        onRefresh: activeRefreshControl ? undefined : onRefresh,
      })}
      {...props}
    />
  );
}
