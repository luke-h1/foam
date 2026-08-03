import { type Ref, useMemo } from 'react';
import { Platform, RefreshControl } from 'react-native';

import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  FlashListRef,
  type ListRenderItem,
} from '@shopify/flash-list';

import { theme } from '@app/styles/themes';

export type { FlashListRef, ListRenderItem };

export type FlashListProps<TItem = unknown> = ShopifyFlashListProps<TItem> & {
  inverted?: boolean;
  onRefresh?: () => void | Promise<unknown>;
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
      ref={ref}
      refreshControl={activeRefreshControl}
      refreshing={activeRefreshControl ? undefined : refreshing}
      onRefresh={activeRefreshControl ? undefined : onRefresh}
      {...props}
    />
  );
}
