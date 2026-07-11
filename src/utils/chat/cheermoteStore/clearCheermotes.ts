import { cheermoteFetchGuard } from '@app/utils/chat/cheermoteStore/cheermoteFetchGuard';
import { cheermotesByChannel } from '@app/utils/chat/cheermoteStore/cheermotesByChannel';

export function clearCheermotes(): void {
  cheermotesByChannel.clear();
  cheermoteFetchGuard.clear();
}
