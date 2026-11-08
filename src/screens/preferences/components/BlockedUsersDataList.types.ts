import type { RefObject } from 'react';

import type { FlashListRef } from '@app/components/flash-list/FlashList';
import type { UserBlockList } from '@app/types/twitch/user';

export interface BlockedUsersDataListProps {
  data: UserBlockList[];
  listRef: RefObject<FlashListRef<UserBlockList> | null>;
  onRefresh: () => Promise<void>;
  onUnblock: (userId: string, userName: string) => void;
  onUnblockDirect: (userId: string) => void;
}
