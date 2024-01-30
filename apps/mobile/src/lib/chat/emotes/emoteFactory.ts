/* eslint-disable @typescript-eslint/no-unused-vars */
import { EmoteIDs, EmotePositions } from '@app/services/ffzService2';
import { getBttvEmotes } from './bttvStore';
import { getFfzEmotes } from './ffzStore';
import { getSevenTvEmotes } from './sevenTvStore';
import { getTwitchEmotesFromMessage } from './twitchStore';

const twitchEmoteUrl = 'https://static-cdn.jtvnw.net/emoticons/v2';
const bttvEmoteUrl = 'https://cdn.betterttv.net/emote';
const ffzEmoteUrl = 'https://cdn.frankerfacez.com/emote';
const sevenTvEmoteUrl = 'https://cdn.7tv.app/emote';

interface EmoteFactory {
  list: EmoteIDs;
  make: (code: string) => string[];
  provider: 'twitch' | '7tv' | 'bttv' | 'ffz';
}

export interface Word {
  text: string;
  emote?: {
    url: string[];
  };
}

export interface ParseEmoteOptions {
  channelId?: string;
  twitchUserId?: string;
  thirdPartyProviders: {
    bttv: boolean;
    ffz: boolean;
    seventv: boolean;
  };
  customEmotes: EmoteFactory | EmoteFactory[];
}

export const emoteFactory = async (
  message: string,
  emotePositions: EmotePositions | null,
  options: ParseEmoteOptions,
): Promise<EmoteFactory[]> => {
  if (!options.twitchUserId) {
    return [];
  }

  const [twitchEmotes, sevenTvEmotes, bttvEmotes] = await Promise.all<
    [EmoteIDs, EmoteIDs, EmoteIDs]
  >([
    await getTwitchEmotesFromMessage(message, emotePositions),
    await getSevenTvEmotes(options.twitchUserId),
    await getBttvEmotes(options.twitchUserId),
    // await getFfzEmotes(options.twitchUserId),
  ]);

  return [
    {
      list: twitchEmotes,
      make: code => [
        `${twitchEmoteUrl}/${twitchEmotes.get(code)}/default/dark/1.0`,
      ],
      provider: 'twitch',
    },
    // {
    //   list: bttvEmotes,
    //   make: code => [`${bttvEmoteUrl}/${bttvEmotes.get(code)}/2x`],
    //   provider: 'bttv',
    // },
    // {
    //   list: ffzEmotes,
    //   make: code => [`${ffzEmoteUrl}/${ffzEmotes.get(code)}/4`],
    // },
    {
      list: sevenTvEmotes,
      provider: '7tv',
      make: code => {
        // avif no workie
        return [`${sevenTvEmoteUrl}/${code}/1x.avif`];
      },
    },
  ];
};
