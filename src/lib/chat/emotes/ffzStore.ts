import ffzService2, {
  ChannelEmotes,
  EmoteIDs,
} from '@app/services/ffzService2';
import { GENERIC_CHANNEL_KEY, GLOBAL_CHANNEL_KEY } from '../config';

const emotes: ChannelEmotes = new Map();

export const getFfzEmotes = async (channelId: string): Promise<EmoteIDs> => {
  let storedGlobalEmotes = emotes.get(GENERIC_CHANNEL_KEY);
  let storedChannelEmotes = emotes.get(channelId);

  if (!storedGlobalEmotes) {
    const globalEmotes = await ffzService2.getGlobalEmotes();
    emotes.set(
      GLOBAL_CHANNEL_KEY,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore $TSFixMe
      new Map(globalEmotes.map(emote => [emote.code, emote.id.toString()])),
    );
  }

  if (!storedChannelEmotes) {
    const channelEmotes = await ffzService2.getChannelEmotes(channelId);
    emotes.set(
      channelId,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore $TSFixMe
      new Map(channelEmotes.map(emote => [emote.code, emote.id.toString()])),
    );
  }

  storedGlobalEmotes = emotes.get(GLOBAL_CHANNEL_KEY);
  storedChannelEmotes = emotes.get(channelId);

  if (!storedGlobalEmotes || !storedChannelEmotes) {
    return new Map();
  }

  return new Map([...storedGlobalEmotes, ...storedChannelEmotes]);
};
