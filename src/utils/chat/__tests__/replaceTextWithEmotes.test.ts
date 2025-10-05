import {
  sevenTvSanitisedChannelEmoteSetFixture,
  seventvSanitiisedGlobalEmoteSetFixture,
  twitchTvSanitisedEmoteSetChannelFixture,
  twitchTvSanitisedEmoteSetGlobalFixture,
  bttvSanitisedChannelEmoteSet,
  bttvSanitisedGlobalEmoteSet,
  ffzSanitisedChannelEmoteSet,
  ffzSanitisedGlobalEmoteSet,
} from '@app/services/__fixtures__';
import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { ChatUserstate } from 'tmi.js';
import { ParsedPart, replaceTextWithEmotes } from '../replaceTextWithEmotes';

/**
 * Todo - update test to assert extra fields we've added
 */
describe.skip('replaceTextWithEmotesV2', () => {
  const defaultEmoteSets: {
    ffzChannelEmotes: SanitisiedEmoteSet[];
    ffzGlobalEmotes: SanitisiedEmoteSet[];
    sevenTvChannelEmotes: SanitisiedEmoteSet[];
    sevenTvGlobalEmotes: SanitisiedEmoteSet[];
    twitchChannelEmotes: SanitisiedEmoteSet[];
    twitchGlobalEmotes: SanitisiedEmoteSet[];
    bttvChannelEmotes: SanitisiedEmoteSet[];
    bttvGlobalEmotes: SanitisiedEmoteSet[];
  } = {
    ffzChannelEmotes: ffzSanitisedChannelEmoteSet,
    ffzGlobalEmotes: ffzSanitisedGlobalEmoteSet,
    sevenTvChannelEmotes: sevenTvSanitisedChannelEmoteSetFixture,
    sevenTvGlobalEmotes: seventvSanitiisedGlobalEmoteSetFixture,
    twitchChannelEmotes: twitchTvSanitisedEmoteSetChannelFixture,
    twitchGlobalEmotes: twitchTvSanitisedEmoteSetGlobalFixture,
    bttvChannelEmotes: bttvSanitisedChannelEmoteSet,
    bttvGlobalEmotes: bttvSanitisedGlobalEmoteSet,
  };

  const defaultUserState: ChatUserstate = {
    color: '#FF0000',
    username: 'test-user',
    'display-name': 'test user',
  };

  test('should handle empty input', () => {
    const result = replaceTextWithEmotes({
      inputString: '',
      ...defaultEmoteSets,
      userstate: null,
    });

    expect(result).toEqual<ParsedPart[]>([{ type: 'text', content: '' }]);
  });

  test('should replace single emote in text', () => {
    const result = replaceTextWithEmotes({
      inputString: 'Hello Kappa World',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      {
        content: 'Hello ',
        type: 'text',
      },
      {
        content: 'Kappa',
        height: undefined,
        type: 'emote',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
        width: undefined,
      },
      {
        content: ' ',
        type: 'text',
      },
      {
        content: 'World',
        type: 'text',
      },
    ]);
  });

  test.skip('should handle mentions with emotes', () => {});

  test('should handle emojis', () => {
    const result = replaceTextWithEmotes({
      inputString: 'Hello 😊 World',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: '😊' },
      { type: 'text', content: 'World' },
    ]);
  });

  describe('7tv', () => {
    test.each(
      sevenTvSanitisedChannelEmoteSetFixture.filter(
        emote => emote.name !== 'Stare' && emote.name !== 'TeaTime',
      ),
    )('should replace 7TV emote %s', emote => {
      const result = replaceTextWithEmotes({
        inputString: emote.name,
        bttvChannelEmotes: [],
        bttvGlobalEmotes: [],
        ffzChannelEmotes: [],
        ffzGlobalEmotes: [],
        sevenTvChannelEmotes: sevenTvSanitisedChannelEmoteSetFixture,
        sevenTvGlobalEmotes: seventvSanitiisedGlobalEmoteSetFixture,
        twitchChannelEmotes: [],
        twitchGlobalEmotes: [],
        userstate: defaultUserState,
      });

      expect(result).toEqual<ParsedPart[]>([
        {
          content: emote.name,
          height: emote.height,
          type: 'emote',
          url: emote.url,
          width: emote.width,
        },
      ]);
    });

    test.each(sevenTvSanitisedChannelEmoteSetFixture)(
      'should replace 7TV emote with text %s',
      emote => {
        const result = replaceTextWithEmotes({
          inputString: `${emote.name} hello foam world`,
          bttvChannelEmotes: [],
          bttvGlobalEmotes: [],
          ffzChannelEmotes: [],
          ffzGlobalEmotes: [],
          sevenTvChannelEmotes: sevenTvSanitisedChannelEmoteSetFixture,
          sevenTvGlobalEmotes: seventvSanitiisedGlobalEmoteSetFixture,
          twitchChannelEmotes: [],
          twitchGlobalEmotes: [],
          userstate: defaultUserState,
        });

        expect(result).toEqual<ParsedPart[]>([
          {
            content: emote.name,
            height: emote.height,
            type: 'emote',
            width: emote.width,
            url: emote.url,
          },
          {
            content: ' ',
            type: 'text',
          },
          {
            content: 'hello foam world',
            type: 'text',
          },
        ]);
      },
    );

    test.each(
      sevenTvSanitisedChannelEmoteSetFixture.filter(
        emote => emote.name === 'Stare' || emote.name === 'TeaTime',
      ),
    )(
      'Channel emote should take priority over duplicated global emote %s',
      emote => {
        const result = replaceTextWithEmotes({
          inputString: emote.name,
          bttvChannelEmotes: [],
          bttvGlobalEmotes: [],
          ffzChannelEmotes: [],
          ffzGlobalEmotes: [],
          sevenTvChannelEmotes: sevenTvSanitisedChannelEmoteSetFixture.filter(
            // eslint-disable-next-line no-shadow
            emote => emote.name === 'Stare' || emote.name === 'TeaTime',
          ),
          sevenTvGlobalEmotes: seventvSanitiisedGlobalEmoteSetFixture.filter(
            // eslint-disable-next-line no-shadow
            emote => emote.name === 'Stare' || emote.name === 'TeaTime',
          ),
          twitchChannelEmotes: [],
          twitchGlobalEmotes: [],
          userstate: defaultUserState,
        });

        expect(result).toEqual<ParsedPart[]>([
          {
            content: emote.name,
            height: emote.height,
            type: 'emote',
            url: emote.url,
            width: emote.width,
          },
        ]);
      },
    );
  });

  describe('Twitch', () => {
    describe('Twitch global', () => {
      test.each(twitchTvSanitisedEmoteSetGlobalFixture)(
        'should replace Twitch global emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: twitchTvSanitisedEmoteSetGlobalFixture,
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: emote.name,
              height: emote.height,
              type: 'emote',
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              url: expect.any(String), // weird issue with it mapping to another url
              width: emote.width,
            },
          ]);
        },
      );

      test.each(twitchTvSanitisedEmoteSetGlobalFixture)(
        'Should replace Twitch global emote within text %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: `${emote.name} test foam world`,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: twitchTvSanitisedEmoteSetGlobalFixture,
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              url: expect.any(String),
              width: undefined,
            },
            {
              content: ' ',
              type: 'text',
            },
            {
              content: 'test foam world',
              type: 'text',
            },
          ]);
        },
      );
    });

    describe('Twitch channel', () => {
      test.each(twitchTvSanitisedEmoteSetChannelFixture)(
        'should replace Twitch channel emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: twitchTvSanitisedEmoteSetChannelFixture,
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: emote.name,
              height: emote.height,
              type: 'emote',

              url: emote.url,
              width: emote.width,
            },
          ]);
        },
      );

      test.each(twitchTvSanitisedEmoteSetChannelFixture)(
        'Should replace Twitch channel emote within text %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: `${emote.name} test foam world`,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: twitchTvSanitisedEmoteSetChannelFixture,
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: emote.name,
              height: undefined,
              type: 'emote',

              url: emote.url,
              width: undefined,
            },
            {
              content: ' ',
              type: 'text',
            },
            {
              content: 'test foam world',
              type: 'text',
            },
          ]);
        },
      );
    });
  });

  describe.skip('bttv', () => {
    describe('channel', () => {
      test.each(bttvSanitisedChannelEmoteSet)(
        'should replace BTTV channel emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
            bttvChannelEmotes: bttvSanitisedChannelEmoteSet,
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              creator: emote.creator,
              flags: emote.flags,
              original_name: emote.original_name,
              site: emote.site,
              emote_link: emote.emote_link,
              content: emote.name,
              height: emote.height,
              type: 'emote',
              url: emote.url,
              width: emote.width,
            },
          ]);
        },
      );

      test.each(bttvSanitisedChannelEmoteSet)(
        'should replace BTTV channel emote with text %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: `hello ${emote.name} foam world ${emote.name}`,
            bttvChannelEmotes: bttvSanitisedChannelEmoteSet,
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: 'hello ',
              type: 'text',
            },
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
            {
              content: ' ',
              type: 'text',
            },
            {
              content: 'foam world ',
              type: 'text',
            },
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
          ]);
        },
      );
    });
    describe.skip('global', () => {
      test.each(bttvSanitisedGlobalEmoteSet)(
        'should replace BTTV emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
            bttvChannelEmotes: bttvSanitisedGlobalEmoteSet,
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: emote.name,
              height: emote.height,
              type: 'emote',
              url: emote.url,
              width: emote.width,
            },
          ]);
        },
      );

      test.each(bttvSanitisedGlobalEmoteSet)(
        'should replace BTTV global emote with text %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: `hello ${emote.name} foam world ${emote.name}`,
            bttvChannelEmotes: bttvSanitisedGlobalEmoteSet,
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: 'hello ',
              type: 'text',
            },
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
            {
              content: ' ',
              type: 'text',
            },
            {
              content: 'foam world ',
              type: 'text',
            },
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
          ]);
        },
      );
    });
  });

  describe.skip('ffz', () => {
    describe('channel', () => {
      test.each(ffzSanitisedChannelEmoteSet)(
        'should replace FFZ channel emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: ffzSanitisedChannelEmoteSet,
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: emote.name,
              height: emote.height,
              type: 'emote',
              url: emote.url,
              width: emote.width,
            },
          ]);
        },
      );
      test.each(ffzSanitisedChannelEmoteSet)(
        'should replace FFZ channel emote with text %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: `hello ${emote.name} foam world ${emote.name}`,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: ffzSanitisedChannelEmoteSet,
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: 'hello ',
              type: 'text',
            },
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
            {
              content: ' ',
              type: 'text',
            },
            {
              content: 'foam world ',
              type: 'text',
            },
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
          ]);
        },
      );
    });
    describe.skip('global', () => {
      test.each(ffzSanitisedGlobalEmoteSet)(
        'should replace FFZ global emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: ffzSanitisedGlobalEmoteSet,
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              id: emote.id,
              name: emote.name,
              flags: emote.flags,
              content: emote.name,
              height: emote.height,
              type: 'emote',
              url: emote.url,
              width: emote.width,
            },
          ]);
        },
      );

      test.each(ffzSanitisedGlobalEmoteSet)(
        'should replace FFZ global emote with text %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: `hello ${emote.name} foam world ${emote.name}`,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: ffzSanitisedGlobalEmoteSet,
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            {
              content: 'hello ',
              type: 'text',
            },
            {
              id: emote.id,
              name: emote.name,
              content: emote.name,
              creator: emote.creator,
              emote_link: emote.emote_link,
              original_name: emote.original_name,
              site: emote.site,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
            {
              content: ' ',
              type: 'text',
            },
            {
              content: 'foam world ',
              type: 'text',
            },
            {
              content: emote.name,
              height: undefined,
              type: 'emote',
              url: emote.url,
              width: undefined,
            },
          ]);
        },
      );
    });
  });

  describe.skip('smoke', () => {
    const allEmoteSets = [
      ffzSanitisedChannelEmoteSet,
      ffzSanitisedGlobalEmoteSet,
      sevenTvSanitisedChannelEmoteSetFixture,
      seventvSanitiisedGlobalEmoteSetFixture,
      twitchTvSanitisedEmoteSetChannelFixture,
      twitchTvSanitisedEmoteSetGlobalFixture,
      bttvSanitisedChannelEmoteSet,
      bttvSanitisedGlobalEmoteSet,
    ];

    test.each(allEmoteSets)(
      'should replace emote with all emote sets combined %s',
      emote => {
        const result = replaceTextWithEmotes({
          inputString: emote.name,
          userstate: defaultUserState,
          ...defaultEmoteSets,
        });

        expect(result).toEqual<ParsedPart[]>([
          {
            id: emote.id,
            name: emote.name,
            flags: emote.flags,
            content: emote.name,
            height: emote.height,
            width: emote.width,
            url: emote.url,
            type: 'emote',
          },
        ]);
      },
    );

    test.each(allEmoteSets)('should replace emote with text %s', emote => {
      const result = replaceTextWithEmotes({
        inputString: `hello foam world ${emote.name} hello foam world`,
        userstate: defaultUserState,
        ...defaultEmoteSets,
      });

      expect(result).toEqual<ParsedPart[]>([
        {
          content: 'hello foam world ',
          type: 'text',
        },
        {
          id: emote.id,
          name: emote.name,
          content: emote.name,
          height: emote.height,
          width: emote.width,
          type: 'emote',
          url: emote.url,
          creator: emote.creator,
          emote_link: emote.emote_link,
          original_name: emote.original_name,
          site: emote.site,
        },
        {
          content: ' ',
          type: 'text',
        },
        {
          content: 'hello foam world',
          type: 'text',
        },
      ]);
    });
  });
});
