import { cheermotesByChannel } from '@app/utils/chat/cheermote-store/cheermotes-by-channel';
import { ChannelCheermotes } from '@app/utils/chat/cheermote-store/types';

export function getChannelCheermotes(
  channelId: string,
): ChannelCheermotes | undefined {
  const cheermotes = cheermotesByChannel.get(channelId);

  if (cheermotes) {
    cheermotesByChannel.delete(channelId);
    cheermotesByChannel.set(channelId, cheermotes);
  }

  return cheermotes;
}
