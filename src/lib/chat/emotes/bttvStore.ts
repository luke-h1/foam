/* eslint-disable no-console */
import bttvService2 from '@app/services/bttvService2';
import { ChannelEmotes, EmoteIDs } from '@app/services/ffzService2';
import { GLOBAL_CHANNEL_KEY } from '../config';

const emotes: ChannelEmotes = new Map();

// TODO: rework from map to object
export const getBttvEmotes = async (channelId: string): Promise<EmoteIDs> => {
  // eslint-disable-next-line no-param-reassign
  let storedGlobalEmotes = emotes.get(GLOBAL_CHANNEL_KEY);
  let storedChannelEmotes = emotes.get(channelId);

  if (!storedGlobalEmotes) {
    const globalEmotes = await bttvService2.getGlobalEmotes();
    emotes.set(
      GLOBAL_CHANNEL_KEY,
      new Map(globalEmotes.map(emote => [emote.code, emote.id])),
    );
  }

  if (!storedChannelEmotes) {
    const channelEmotes = await bttvService2.getChannelEmotes(channelId);
    emotes.set(
      channelId,
      new Map([
        ...new Map(
          channelEmotes.channelEmotes.map(emote => [emote.code, emote.id]),
        ),
        ...new Map(
          channelEmotes.sharedEmotes.map(emote => [emote.code, emote.id]),
        ),
      ]),
    );
  }
  storedGlobalEmotes = emotes.get(GLOBAL_CHANNEL_KEY);
  storedChannelEmotes = emotes.get(channelId);
  if (!storedGlobalEmotes || !storedChannelEmotes) {
    console.error('Could not retrieve stored BTTV emotes');
    return new Map();
  }
  return new Map([...storedGlobalEmotes, ...storedChannelEmotes]);
};
