/* eslint-disable no-useless-return */
import { EmotesList, EmotesLoader, MessageParser } from '../types';

export const makeEmoteParser = (
  name: string,
  loaders: ((channelId: string | null) => Promise<EmotesList>)[],
  getEmoteURLs: (emoteId: string) => Promise<
    {
      width: number;
      height: number;
      url: string;
    }[]
  >,
) => {
  let emotesList: EmotesList = [];

  const load: EmotesLoader = async (channelId, force = false) => {
    const hasLoaded = emotesList.find(
      channel => channel.channelId === channelId,
    );

    if (hasLoaded && !force) {
      return;
    }
    emotesList = [
      ...(await Promise.all(loaders.map(loader => loader(channelId)))).flat(),
    ];
  };

  const parse: MessageParser = async (message, emotePositions, options) => {
    await load(options.channelId, false);

    return Promise.all(
      message.map(async word => {
        const emote = emotesList.find(
          c => c.code === word.content && c.channelId === options.channelId,
        );

        if (emote) {
          return {
            ...word,
            emote: {
              images: await getEmoteURLs(emote.id),
              isZeroWidth: emote.isZeroWidth,
            },
          };
        }
        return word;
      }),
    );
  };

  return {
    provider: name,
    parse,
    load,
  };
};
