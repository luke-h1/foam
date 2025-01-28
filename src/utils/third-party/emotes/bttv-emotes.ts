import { bttvService } from '@app/services';
import { makeEmoteParser } from './make-emote-parser';

export const bttvMessageParser = makeEmoteParser(
  'bttv',
  [bttvService.getChannelEmotes, bttvService.getGlobalEmotes],
  async (emoteId: string) =>
    ['1x', '2x', '3x'].map(scale => ({
      width: parseInt(scale, 10) * 22,
      height: parseInt(scale, 10) * 22,
      url: `https://cdn.betterttv.net/emote/${emoteId}/${scale}`,
    })),
);
