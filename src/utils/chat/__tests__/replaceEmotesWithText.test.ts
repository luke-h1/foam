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
import { replaceEmotesWithText } from '../replaceEmotesWithText';

describe('replaceEmotesWithText', () => {
  test('should handle empty input', () => {
    expect(replaceEmotesWithText([])).toEqual('');
  });

  const allEmoteSets = [
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
        expect(result).toEqual(emote.original_name || emote.name);
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
          expect(result).toEqual(
            `Hello ${emote.original_name || emote.name} World`,
          );
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
        expect(result).toEqual(
          `Hello ${emote.original_name || emote.name} ${emote.original_name || emote.name} World`,
        );
      });
    });
  });

  test('should handle mixed emote types', () => {
    const result = replaceEmotesWithText([
      { type: 'text', content: 'Hello ' },
      {
        type: 'emote',
        content: ffzSanitisedChannelEmoteSet[0]?.name as string,
        ...ffzSanitisedChannelEmoteSet[0],
      },
      { type: 'text', content: ' ' },
      {
        type: 'emote',
        content: sevenTvSanitisedChannelEmoteSetFixture[0]?.name as string,
        ...sevenTvSanitisedChannelEmoteSetFixture[0],
      },
      { type: 'text', content: ' World' },
    ]);

    expect(result).toEqual(
      `Hello ${ffzSanitisedChannelEmoteSet[0]?.original_name || ffzSanitisedChannelEmoteSet[0]?.name} ${
        sevenTvSanitisedChannelEmoteSetFixture[0]?.original_name ||
        sevenTvSanitisedChannelEmoteSetFixture[0]?.name
      } World`,
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
});
