import { cheermoteFetchGuard } from '@app/utils/chat/cheermote-store/cheermote-fetch-guard';
import { cheermotesByChannel } from '@app/utils/chat/cheermote-store/cheermotes-by-channel';

export function clearCheermotes(): void {
  cheermotesByChannel.clear();
  cheermoteFetchGuard.clear();
}
