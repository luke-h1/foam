import { cheermoteFetchGuard } from '@app/utils/chat/cheermote-store/cheermoteFetchGuard';
import { cheermotesByChannel } from '@app/utils/chat/cheermote-store/cheermotesByChannel';

export function clearCheermotes(): void {
  cheermotesByChannel.clear();
  cheermoteFetchGuard.clear();
}
