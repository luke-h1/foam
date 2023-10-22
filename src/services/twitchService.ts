/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosHeaders } from 'axios';
import { twitchApi } from './Client';
import twitchSerializer from './serializers/twitch';
import { EmoteTypes } from './serializers/types';

const twitchService = {
  getGlobalEmotes: async (headers: AxiosHeaders) => {
    const res = await twitchApi.get('/chat/emotes/global', {
      headers,
    });

    // TODO: type this once auth is sorted
    const emotes = res.data.map((emote: any) => {
      return twitchSerializer.fromTwitchEmote(emote, EmoteTypes.TwitchGlobal);
    });

    return emotes;
  },
  getChannelEmotes: async (id: string, headers: AxiosHeaders) => {
    const res = await twitchApi.get(`/chat/emotes?broadcaster_id=${id}`, {
      headers,
    });

    return res.data.map((emote: any) => {
      switch (emote.type) {
        case 'bitstier':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchBitsTier,
          );

        case 'follower':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchFollower,
          );

        case 'subscriptions':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchChannel,
          );

        default:
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchChannel,
          );
      }
    });
  },
  getEmoteSets: async (setId: string, headers?: AxiosHeaders) => {
    const res = await twitchApi.get(`/chat/emotes/set?emote_set_id=${setId}`, {
      headers,
    });

    return res.data.map((emote: any) => {
      switch (emote.type) {
        case 'globals':
        case 'smilies':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchGlobal,
          );

        case 'subscriptions':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchSubscriber,
          );

        default:
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchUnlocked,
          );
      }
    });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getGlobalBadges: async (headers: AxiosHeaders) => {},
};

export default twitchService;
