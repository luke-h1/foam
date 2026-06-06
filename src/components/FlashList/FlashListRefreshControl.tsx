import { RefreshControl } from '@app/components/RefreshControl/RefreshControl';

export function FlashListRefreshControl({
  onRefresh,
}: {
  onRefresh: () => void | Promise<unknown>;
}) {
  return <RefreshControl onRefresh={() => Promise.resolve(onRefresh())} />;
}
