import ffzService from '@app/services/ffzService';
import { makeEmoteParser } from './make-emote-parser';

export const ffzMessageParser = makeEmoteParser(
  'ffz',
  [ffzService.getChannelEmotes, ffzService.getGlobalEmotes],
  async (emoteId: string) =>
    ['1', '2', '4'].map(scale => ({
      width: parseInt(scale, 10) * 28,
      height: parseInt(scale, 10) * 28,
      url: `https://cdn.frankerfacez.com/emote/${emoteId}/${scale}`,
    })),
);
