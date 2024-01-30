import { ChannelEmotes, EmoteIDs } from '@app/services/ffzService2';
import seventvService2 from '@app/services/seventvService2';
import logger from '@app/utils/logger';
import { GLOBAL_CHANNEL_KEY } from '../config';

const emotes: ChannelEmotes = new Map();

export const getSevenTvEmotes = async (
  channelId: string,
): Promise<EmoteIDs> => {
  let storedGlobalEmotes = emotes.get(GLOBAL_CHANNEL_KEY);
  let storedChannelEmotes = emotes.get(channelId);

  if (!storedGlobalEmotes) {
    const globalEmotes = await seventvService2.getGlobalEmotes();
    storedGlobalEmotes = new Map(
      globalEmotes.map(item => [item.name, item.id]),
    );
    emotes.set(GLOBAL_CHANNEL_KEY, storedGlobalEmotes);
  }

  if (!storedChannelEmotes) {
    const channelEmotes = await seventvService2.getChannelEmotes(channelId);
    storedChannelEmotes = new Map(
      channelEmotes.map(item => [item.name, item.id]),
    );
    emotes.set(channelId, storedChannelEmotes);
  }

  if (!storedGlobalEmotes || !storedChannelEmotes) {
    logger.error('Could not retrieve stored 7TV emotes');
    return new Map();
  }
  return new Map([...storedGlobalEmotes, ...storedChannelEmotes]);
};
