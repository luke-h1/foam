import { cheermotesByChannel } from '@app/utils/chat/cheermoteStore/cheermotesByChannel';
import { ChannelCheermotes } from '@app/utils/chat/cheermoteStore/types';

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
