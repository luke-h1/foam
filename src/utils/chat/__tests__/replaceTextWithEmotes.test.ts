import { bttvSanitisedChannelEmoteSet } from '@app/services/__fixtures__/emotes/bttv/bttvSanitisedChannelEmoteSet.fixture';
import { bttvSanitisedGlobalEmoteSet } from '@app/services/__fixtures__/emotes/bttv/bttvSanitisedGlobalEmoteSet.fixture';
import { ffzSanitisedChannelEmoteSet } from '@app/services/__fixtures__/emotes/ffz/ffzSanitisedChannelEmoteSet.fixture';
import { ffzSanitisedGlobalEmoteSet } from '@app/services/__fixtures__/emotes/ffz/ffzSanitisedGlobalEmoteSet.fixture';
import { sevenTvSanitisedChannelEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedChannelEmoteSet.fixture';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';
import { twitchTvSanitisedEmoteSetChannelFixture } from '@app/services/__fixtures__/emotes/twitch/twitchTvSanitisedEmoteSetChannel.fixture';
import { twitchTvSanitisedEmoteSetGlobalFixture } from '@app/services/__fixtures__/emotes/twitch/twitchTvSanitisedEmoteSetGlobal.fixture';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { SanitisedEmote } from '@app/types/emote';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';

import { ParsedPart } from '../parsedPart';
import { replaceTextWithEmotes } from '../replaceTextWithEmotes';

describe('replaceTextWithEmotesV2', () => {
  const defaultEmoteSets: {
    ffzChannelEmotes: SanitisedEmote[];
    ffzGlobalEmotes: SanitisedEmote[];
    sevenTvChannelEmotes: SanitisedEmote[];
    sevenTvGlobalEmotes: SanitisedEmote[];
    twitchChannelEmotes: SanitisedEmote[];
    twitchGlobalEmotes: SanitisedEmote[];
    bttvChannelEmotes: SanitisedEmote[];
    bttvGlobalEmotes: SanitisedEmote[];
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

  const defaultUserState = createUserStateTags({
    color: '#FF0000',
    username: 'test-user',
    'display-name': 'test user',
  });

  function expectedEmotePart(
    emote: SanitisedEmote,
    contentOverride?: string,
  ): ParsedPart {
    const resolved = withResolvedEmoteImageVariants(emote);
    return {
      type: 'emote',
      content: contentOverride ?? emote.name,
      ...resolved,
    } as ParsedPart;
  }

  /**
   * Mirrors registerEmoteLookup in replaceTextWithEmotes: each emote also
   * registers its original_name as an alternate lookup key, so an emote whose
   * name matches an earlier emote's name or alias never resolves to itself.
   * Tests can only assert exact output for emotes that win their lookup key.
   */
  function resolvableEmotes(emotes: SanitisedEmote[]): SanitisedEmote[] {
    const seen = new Set<string>();
    const result: SanitisedEmote[] = [];
    emotes.forEach(emote => {
      if (!seen.has(emote.name)) {
        result.push(emote);
      }
      seen.add(emote.name);
      const alternateName = emote.original_name?.trim();
      if (alternateName) {
        seen.add(alternateName);
      }
    });
    return result;
  }

  test('should handle empty input', () => {
    const result = replaceTextWithEmotes({
      inputString: '',
      ...defaultEmoteSets,
      userstate: null,
    });

    expect(result).toEqual<ParsedPart[]>([{ type: 'text', content: '' }]);
  });

  test('should replace single emote in text', () => {
    const kappaEmote = twitchTvSanitisedEmoteSetGlobalFixture.find(
      e => e.name === 'Kappa',
    )!;

    const result = replaceTextWithEmotes({
      inputString: 'Hello Kappa World',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      { content: 'Hello', type: 'text' },
      { content: ' ', type: 'text' },
      expectedEmotePart(kappaEmote),
      { content: ' ', type: 'text' },
      { content: 'World', type: 'text' },
    ]);
  });

  test('should handle mentions without emote matches', () => {
    const result = replaceTextWithEmotes({
      inputString: '@someUser hello',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      { type: 'mention', content: '@someUser' },
      { content: ' ', type: 'text' },
      { content: 'hello', type: 'text' },
    ]);
  });

  test('should split trailing punctuation off a mention', () => {
    const result = replaceTextWithEmotes({
      inputString: '@someUser, hello',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      { type: 'mention', content: '@someUser' },
      { content: ',', type: 'text' },
      { content: ' ', type: 'text' },
      { content: 'hello', type: 'text' },
    ]);
  });

  test('should split each mention in a comma-separated list', () => {
    const result = replaceTextWithEmotes({
      inputString: '@userOne, @userTwo',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      { type: 'mention', content: '@userOne' },
      { content: ',', type: 'text' },
      { content: ' ', type: 'text' },
      { type: 'mention', content: '@userTwo' },
    ]);
  });

  test('should match emotes case-sensitively', () => {
    const kappaEmote = twitchTvSanitisedEmoteSetGlobalFixture.find(
      e => e.name === 'Kappa',
    )!;

    const result = replaceTextWithEmotes({
      inputString: 'kappa KAPPA Kappa',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      { content: 'kappa', type: 'text' },
      { content: ' ', type: 'text' },
      { content: 'KAPPA', type: 'text' },
      { content: ' ', type: 'text' },
      expectedEmotePart(kappaEmote),
    ]);
  });

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

  test('should filter out replacement character (encoding issues)', () => {
    // U+FFFD is the unicode replacement character (?) for invalid/malformed text
    const result = replaceTextWithEmotes({
      inputString: 'Hello � World',
      ...defaultEmoteSets,
      userstate: defaultUserState,
    });

    expect(result).toEqual<ParsedPart[]>([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: 'World' },
    ]);
  });

  describe('7tv', () => {
    test.each(
      resolvableEmotes(sevenTvSanitisedChannelEmoteSetFixture).filter(
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

      expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
    });

    test.each(resolvableEmotes(sevenTvSanitisedChannelEmoteSetFixture))(
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
          expectedEmotePart(emote),
          { content: ' ', type: 'text' },
          { content: 'hello', type: 'text' },
          { content: ' ', type: 'text' },
          { content: 'foam', type: 'text' },
          { content: ' ', type: 'text' },
          { content: 'world', type: 'text' },
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
        const channelSet = sevenTvSanitisedChannelEmoteSetFixture.filter(
          // eslint-disable-next-line no-shadow
          emote => emote.name === 'Stare' || emote.name === 'TeaTime',
        );
        const globalSet = seventvSanitiisedGlobalEmoteSetFixture.filter(
          // eslint-disable-next-line no-shadow
          emote => emote.name === 'Stare' || emote.name === 'TeaTime',
        );

        const result = replaceTextWithEmotes({
          inputString: emote.name,
          bttvChannelEmotes: [],
          bttvGlobalEmotes: [],
          ffzChannelEmotes: [],
          ffzGlobalEmotes: [],
          sevenTvChannelEmotes: channelSet,
          sevenTvGlobalEmotes: globalSet,
          twitchChannelEmotes: [],
          twitchGlobalEmotes: [],
          userstate: defaultUserState,
        });

        expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
      },
    );
  });

  describe('Twitch', () => {
    describe('Twitch global', () => {
      const uniqueTwitchGlobal = resolvableEmotes(
        twitchTvSanitisedEmoteSetGlobalFixture,
      );

      test.each(uniqueTwitchGlobal)(
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

          expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
        },
      );

      test.each(uniqueTwitchGlobal)(
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
            expectedEmotePart(emote),
            { content: ' ', type: 'text' },
            { content: 'test', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'foam', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'world', type: 'text' },
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

          expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
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
            expectedEmotePart(emote),
            { content: ' ', type: 'text' },
            { content: 'test', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'foam', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'world', type: 'text' },
          ]);
        },
      );
    });
  });

  describe('bttv', () => {
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

          expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
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
            { content: 'hello', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
            { content: ' ', type: 'text' },
            { content: 'foam', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'world', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
          ]);
        },
      );
    });

    describe('global', () => {
      test.each(bttvSanitisedGlobalEmoteSet)(
        'should replace BTTV emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: bttvSanitisedGlobalEmoteSet,
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
        },
      );

      test.each(bttvSanitisedGlobalEmoteSet)(
        'should replace BTTV global emote with text %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: `hello ${emote.name} foam world ${emote.name}`,
            bttvChannelEmotes: [],
            bttvGlobalEmotes: bttvSanitisedGlobalEmoteSet,
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            userstate: defaultUserState,
          });

          expect(result).toEqual<ParsedPart[]>([
            { content: 'hello', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
            { content: ' ', type: 'text' },
            { content: 'foam', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'world', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
          ]);
        },
      );
    });
  });

  describe('ffz', () => {
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

          expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
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
            { content: 'hello', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
            { content: ' ', type: 'text' },
            { content: 'foam', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'world', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
          ]);
        },
      );
    });

    describe('global', () => {
      test.each(ffzSanitisedGlobalEmoteSet)(
        'should replace FFZ global emote %s',
        emote => {
          const result = replaceTextWithEmotes({
            inputString: emote.name,
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

          expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
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
            { content: 'hello', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
            { content: ' ', type: 'text' },
            { content: 'foam', type: 'text' },
            { content: ' ', type: 'text' },
            { content: 'world', type: 'text' },
            { content: ' ', type: 'text' },
            expectedEmotePart(emote),
          ]);
        },
      );
    });
  });

  describe('smoke', () => {
    const allEmoteSets: SanitisedEmote[][] = [
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

        expect(result).toEqual<ParsedPart[]>([expectedEmotePart(emote)]);
      },
    );

    test.each(allEmoteSets)('should replace emote with text %s', emote => {
      const result = replaceTextWithEmotes({
        inputString: `hello foam world ${emote.name} hello foam world`,
        userstate: defaultUserState,
        ...defaultEmoteSets,
      });

      expect(result).toEqual<ParsedPart[]>([
        { content: 'hello', type: 'text' },
        { content: ' ', type: 'text' },
        { content: 'foam', type: 'text' },
        { content: ' ', type: 'text' },
        { content: 'world', type: 'text' },
        { content: ' ', type: 'text' },
        expectedEmotePart(emote),
        { content: ' ', type: 'text' },
        { content: 'hello', type: 'text' },
        { content: ' ', type: 'text' },
        { content: 'foam', type: 'text' },
        { content: ' ', type: 'text' },
        { content: 'world', type: 'text' },
      ]);
    });
  });
});
