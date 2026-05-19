import type {
  BttvSanitisedEmote,
  EmojiSanitisedEmote,
  FfzSanitisedEmote,
  SanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';
import { measureFunction } from 'reassure';
import { processEmotesWorklet } from '../emoteProcessor';
import { extractEmotesFromTag } from '../extractEmotes';
import {
  findEmotesInText,
  replaceTextWithEmotes,
} from '../replaceTextWithEmotes';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

const emptyEmotes: SanitisedEmote[] = [];

const emptyParams = {
  userstate: null,
  emojiEmotes: emptyEmotes,
  sevenTvGlobalEmotes: emptyEmotes,
  sevenTvChannelEmotes: emptyEmotes,
  sevenTvPersonalEmotes: emptyEmotes,
  twitchGlobalEmotes: emptyEmotes,
  twitchChannelEmotes: emptyEmotes,
  twitchSubscriberEmotes: emptyEmotes,
  ffzChannelEmotes: emptyEmotes,
  ffzGlobalEmotes: emptyEmotes,
  bttvChannelEmotes: emptyEmotes,
  bttvGlobalEmotes: emptyEmotes,
};

function createBttvEmote(index: number): BttvSanitisedEmote {
  const id = `bttv-${index}`;
  const name = `BTTV${index}`;

  return {
    id,
    name,
    original_name: name,
    creator: null,
    emote_link: `https://betterttv.com/emotes/${id}`,
    url: `https://cdn.betterttv.net/emote/${id}/3x`,
    static_url: `https://cdn.betterttv.net/emote/${id}/3x.png`,
    image_variants: {
      animated: {
        '2x': `https://cdn.betterttv.net/emote/${id}/2x`,
        '3x': `https://cdn.betterttv.net/emote/${id}/3x`,
      },
      static: {
        '2x': `https://cdn.betterttv.net/emote/${id}/2x.png`,
        '3x': `https://cdn.betterttv.net/emote/${id}/3x.png`,
      },
    },
    site: index % 2 === 0 ? 'BTTV' : 'Global BTTV',
  };
}

function createFfzEmote(index: number): FfzSanitisedEmote {
  const id = `ffz-${index}`;
  const name = `FFZ${index}`;

  return {
    id,
    name,
    original_name: name,
    creator: null,
    emote_link: `https://www.frankerfacez.com/emoticon/${id}`,
    url: `https://cdn.frankerfacez.com/emote/${id}/4`,
    static_url: `https://cdn.frankerfacez.com/emote/${id}/4`,
    image_variants: {
      animated: {
        '2x': `https://cdn.frankerfacez.com/emote/${id}/animated/2`,
        '4x': `https://cdn.frankerfacez.com/emote/${id}/animated/4`,
      },
      static: {
        '2x': `https://cdn.frankerfacez.com/emote/${id}/2`,
        '4x': `https://cdn.frankerfacez.com/emote/${id}/4`,
      },
    },
    site: index % 2 === 0 ? 'FFZ' : 'Global FFZ',
    width: 32,
    height: 32,
    aspect_ratio: 1,
  };
}

function createTwitchEmote(index: number): TwitchSanitisedEmote {
  const id = `twitch-${index}`;
  const name = `Twitch${index}`;

  return {
    id,
    name,
    original_name: name,
    creator: null,
    emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
    url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
    static_url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/3.0`,
    image_variants: {
      animated: {
        '2x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
        '4x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
      },
      static: {
        '2x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/2.0`,
        '4x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/3.0`,
      },
    },
    site: index % 2 === 0 ? 'Twitch Channel' : 'Twitch Global',
  };
}

const emojiEmotes: EmojiSanitisedEmote[] = [
  {
    id: '1F602',
    name: ':joy:',
    original_name: ':joy:',
    creator: null,
    emote_link: 'https://emoji.example/1F602',
    url: 'https://emoji.example/1F602.png',
    static_url: 'https://emoji.example/1F602.png',
    site: 'Emoji',
    emoji_hexcode: '1F602',
  },
  {
    id: '2764-FE0F',
    name: ':heart:',
    original_name: ':heart:',
    creator: null,
    emote_link: 'https://emoji.example/2764-FE0F',
    url: 'https://emoji.example/2764-FE0F.png',
    static_url: 'https://emoji.example/2764-FE0F.png',
    site: 'Emoji',
    emoji_hexcode: '2764-FE0F',
  },
];

const bttvEmotes = Array.from({ length: 180 }, (_, index) =>
  createBttvEmote(index),
);
const ffzEmotes = Array.from({ length: 160 }, (_, index) =>
  createFfzEmote(index),
);
const twitchEmotes = Array.from({ length: 120 }, (_, index) =>
  createTwitchEmote(index),
);

const bttvChannelEmotes = bttvEmotes.filter(emote => emote.site === 'BTTV');
const bttvGlobalEmotes = bttvEmotes.filter(
  emote => emote.site === 'Global BTTV',
);
const ffzChannelEmotes = ffzEmotes.filter(emote => emote.site === 'FFZ');
const ffzGlobalEmotes = ffzEmotes.filter(emote => emote.site === 'Global FFZ');
const twitchChannelEmotes = twitchEmotes.filter(
  emote => emote.site === 'Twitch Channel',
);
const twitchGlobalEmotes = twitchEmotes.filter(
  emote => emote.site === 'Twitch Global',
);

const parserParams = {
  ...emptyParams,
  emojiEmotes,
  bttvChannelEmotes,
  bttvGlobalEmotes,
  ffzChannelEmotes,
  ffzGlobalEmotes,
  twitchChannelEmotes,
  twitchGlobalEmotes,
};

const chatLines = Array.from({ length: 240 }, (_, index) => {
  const bttv = bttvEmotes[index % bttvEmotes.length]?.name ?? 'BTTV0';
  const ffz = ffzEmotes[(index * 7) % ffzEmotes.length]?.name ?? 'FFZ0';
  const twitch =
    twitchEmotes[(index * 11) % twitchEmotes.length]?.name ?? 'Twitch0';
  const emoji = index % 2 === 0 ? '😂' : '❤️';
  const urlSafeText = `https://example.com/${bttv}`;

  return `@viewer${index % 20} ${bttv} combo ${ffz}, ${twitch}! ${emoji} ${urlSafeText}`;
});

const denseEmoteMap = new Map<string, SanitisedEmote>(
  [...bttvEmotes, ...ffzEmotes, ...twitchEmotes].map(emote => [
    emote.name,
    emote,
  ]),
);

const compoundWords = Array.from({ length: 180 }, (_, index) => {
  const prefix = index % 2 === 0 ? 'prefix' : '';
  const bttv = bttvEmotes[index % bttvEmotes.length]?.name ?? 'BTTV0';
  const ffz = ffzEmotes[(index * 5) % ffzEmotes.length]?.name ?? 'FFZ0';
  return `${prefix}${bttv},${ffz}`;
});

function createTwitchTagFixture(count: number) {
  let message = '';
  const positions: string[] = [];

  Array.from({ length: count }).forEach(() => {
    const start = message.length;
    message += 'Kappa ';
    positions.push(`${start}-${start + 4}`);
  });

  return {
    message,
    tag: `25:${positions.join(',')}`,
  };
}

const twitchTagFixture = createTwitchTagFixture(120);

describe('chat parser performance', () => {
  test('replaces emotes in a mixed chat batch', async () => {
    await measureFunction(() => {
      chatLines.forEach(inputString => {
        replaceTextWithEmotes({
          ...parserParams,
          inputString,
        });
      });
    }, MEASURE_OPTIONS);
  });

  test('runs cached emote processing for repeated chat batches', async () => {
    await measureFunction(() => {
      chatLines.forEach(inputString => {
        processEmotesWorklet({
          ...parserParams,
          inputString,
        });
      });
    }, MEASURE_OPTIONS);
  });

  test('finds embedded emotes in dense provider maps', async () => {
    await measureFunction(() => {
      compoundWords.forEach(word => {
        findEmotesInText(word, denseEmoteMap);
      });
    }, MEASURE_OPTIONS);
  });

  test('extracts dense Twitch IRC emote tags', async () => {
    await measureFunction(() => {
      Array.from({ length: 80 }).forEach(() => {
        extractEmotesFromTag(twitchTagFixture.tag, twitchTagFixture.message);
      });
    }, MEASURE_OPTIONS);
  });
});
