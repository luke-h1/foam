/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
import { sevenTvService } from '@app/services';
import { EmotesParser } from '../types';
import { makeEmoteParser } from './make-emote-parser';

const getEmoteUrl = async (emoteId: string, scale: string) => {
  const data = await sevenTvService.getEmote(emoteId);

  const scaleMap: { [key: string]: { width: number; height: number } } = {
    '1x': {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      width: data.host.files[0]!.width - 25,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      height: data.host.files[0]!.height - 25,
    },
    '2x': {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      width: data.host.files[1]!.width - 25,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      height: data.host.files[1]!.height - 25,
    },
    '3x': {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      width: data.host.files[2]!.width - 25,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      height: data.host.files[2]!.height - 25,
    },
    '4x': {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      width: data.host.files[3]!.width - 25,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      height: data.host.files[3]!.height - 25,
    },
  };

  const { width, height } = scaleMap[scale] as {
    width: number;
    height: number;
  };

  return {
    url: `https:${data.host.url}/${scale}.webp`,
    width,
    height,
  };
};

export const stvMessageParser = makeEmoteParser(
  'seventv',
  [sevenTvService.getChannelEmotes, sevenTvService.getGlobalEmotes],
  async (emoteId: string) => {
    const emoteUrls = await Promise.all(
      ['1x', '2x', '3x', '4x'].map(scale => getEmoteUrl(emoteId, scale)),
    );

    return emoteUrls;
  },
);

export const stvOverlayParser: EmotesParser = {
  provider: 'seventv',
  parse: async message => {
    return message.reduce(async (messagePromise, word, index, arr) => {
      // eslint-disable-next-line no-shadow
      const message = await messagePromise;

      if (
        word.emote &&
        word.emote.images.length > 0 &&
        !word.emote.isZeroWidth
      ) {
        if (!word.emote.overlays) {
          // eslint-disable-next-line no-param-reassign
          word.emote.overlays = [];
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        arr.slice(index + 1).some(nextWord => {
          if (nextWord.emote && nextWord.emote.isZeroWidth) {
            word?.emote?.overlays?.push({
              images: nextWord.emote.images,
              alt: nextWord.content,
            });
            arr.splice(index + 1, 1);
          } else {
            return true;
          }
        });
        return message;
      }

      return message;
    }, Promise.resolve(message));
  },
  load: async () => {},
};
