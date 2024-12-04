import bttvService from '@app/services/bttvService';
import { makeEmoteParser } from './make-emote-parser';

export const bttvMessageParser = makeEmoteParser(
  'bttv',
  [bttvService.getChannelEmotes, bttvService.getGlobalEmotes],
  async (emoteId: string) =>
    ['1x', '2x', '3x'].map(scale => ({
      width: parseInt(scale, 10) * 28,
      height: parseInt(scale, 10) * 28,
      url: `https://cdn.betterttv.net/emote/${emoteId}/${scale}`,
    })),
);
