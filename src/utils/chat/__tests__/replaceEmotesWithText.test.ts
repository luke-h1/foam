import { bttvSanitisedChannelEmoteSet } from '@app/services/__fixtures__/emotes/bttv/bttvSanitisedChannelEmoteSet.fixture';
import { bttvSanitisedGlobalEmoteSet } from '@app/services/__fixtures__/emotes/bttv/bttvSanitisedGlobalEmoteSet.fixture';
import { ffzSanitisedChannelEmoteSet } from '@app/services/__fixtures__/emotes/ffz/ffzSanitisedChannelEmoteSet.fixture';
import { ffzSanitisedGlobalEmoteSet } from '@app/services/__fixtures__/emotes/ffz/ffzSanitisedGlobalEmoteSet.fixture';
import { sevenTvSanitisedChannelEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedChannelEmoteSet.fixture';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';
import { twitchTvSanitisedEmoteSetChannelFixture } from '@app/services/__fixtures__/emotes/twitch/twitchTvSanitisedEmoteSetChannel.fixture';
import { twitchTvSanitisedEmoteSetGlobalFixture } from '@app/services/__fixtures__/emotes/twitch/twitchTvSanitisedEmoteSetGlobal.fixture';
import type { SanitisedEmote } from '@app/types/emote';
import { replaceEmotesWithText } from '../replaceEmotesWithText';

describe('replaceEmotesWithText', () => {
  test('should handle empty input', () => {
    expect(replaceEmotesWithText([])).toEqual('');
  });

  const allEmoteSets: { name: string; emotes: SanitisedEmote[] }[] = [
    { name: 'FFZ Channel', emotes: ffzSanitisedChannelEmoteSet },
    { name: 'FFZ Global', emotes: ffzSanitisedGlobalEmoteSet },
    { name: '7TV Channel', emotes: sevenTvSanitisedChannelEmoteSetFixture },
    { name: '7TV Global', emotes: seventvSanitiisedGlobalEmoteSetFixture },
    { name: 'Twitch Channel', emotes: twitchTvSanitisedEmoteSetChannelFixture },
    { name: 'Twitch Global', emotes: twitchTvSanitisedEmoteSetGlobalFixture },
    { name: 'BTTV Channel', emotes: bttvSanitisedChannelEmoteSet },
    { name: 'BTTV Global', emotes: bttvSanitisedGlobalEmoteSet },
  ];

  allEmoteSets.forEach(({ name, emotes }) => {
    describe(name, () => {
      test.each(emotes)('should convert single emote %s to text', emote => {
        const result = replaceEmotesWithText([
          {
            type: 'emote',
            content: emote.name,
            ...emote,
          },
        ]);
        expect(result).toEqual(emote.name);
      });

      test.each(emotes)(
        'should convert emote %s with surrounding text',
        emote => {
          const result = replaceEmotesWithText([
            { type: 'text', content: 'Hello ' },
            {
              type: 'emote',
              content: emote.name,
              ...emote,
            },
            { type: 'text', content: ' World' },
          ]);
          expect(result).toEqual(`Hello ${emote.name} World`);
        },
      );

      test.each(emotes)('should convert multiple emotes %s', emote => {
        const result = replaceEmotesWithText([
          { type: 'text', content: 'Hello ' },
          {
            type: 'emote',
            content: emote.name,
            ...emote,
          },
          { type: 'text', content: ' ' },
          {
            type: 'emote',
            content: emote.name,
            ...emote,
          },
          { type: 'text', content: ' World' },
        ]);
        expect(result).toEqual(`Hello ${emote.name} ${emote.name} World`);
      });
    });
  });

  test('should handle mixed emote types', () => {
    const ffzEmote = ffzSanitisedChannelEmoteSet[0];
    const sevenTvEmote = sevenTvSanitisedChannelEmoteSetFixture[0];

    if (!ffzEmote || !sevenTvEmote) {
      throw new Error('Expected fixture emotes to be defined');
    }

    const result = replaceEmotesWithText([
      { type: 'text', content: 'Hello ' },
      {
        type: 'emote',
        content: ffzEmote.name,
        ...ffzEmote,
      },
      { type: 'text', content: ' ' },
      {
        type: 'emote',
        content: sevenTvEmote.name,
        ...sevenTvEmote,
      },
      { type: 'text', content: ' World' },
    ]);

    expect(result).toEqual(
      `Hello ${ffzSanitisedChannelEmoteSet[0]?.name} ${sevenTvSanitisedChannelEmoteSetFixture[0]?.name} World`,
    );
  });

  test('should handle mentions', () => {
    const result = replaceEmotesWithText([
      { type: 'text', content: 'Hello ' },
      {
        type: 'mention',
        content: '@user',
        color: '#FF0000',
      },
      { type: 'text', content: ' World' },
    ]);
    expect(result).toBe('Hello @user  World');
  });

  test('does not stringify custom object parts', () => {
    const result = replaceEmotesWithText([
      { type: 'text', content: 'Added ' },
      {
        type: 'stv_emote_added',
        stvEvents: {
          type: 'added',
          data: {
            id: '123',
            name: 'Dance',
            url: 'https://example.com/dance.png',
            original_name: 'Dance',
            site: 'BTTV',
            creator: null,
            emote_link: '',
            height: 32,
            width: 32,
          },
        },
      },
      { type: 'text', content: 'event' },
    ]);

    expect(result).toEqual('Added event');
    expect(result).not.toContain('[object Object]');
  });
});
