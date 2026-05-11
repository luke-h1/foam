import { extractEmotesFromTag, parseTwitchEmotesTag } from '../extractEmotes';

describe('extractEmotes', () => {
  test('parses Twitch IRC emote tags with multiple emotes and positions', () => {
    expect(parseTwitchEmotesTag('25:0-4,12-16/1902:6-10')).toEqual({
      '25': ['0-4', '12-16'],
      '1902': ['6-10'],
    });
  });

  test('extracts Twitch tagged subscriber emotes as renderable emotes', () => {
    const result = extractEmotesFromTag('emotesv2_sub:6-12', 'hello SubHype');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'emotesv2_sub',
        name: 'SubHype',
        original_name: 'SubHype',
        site: 'Twitch Subscriber',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
      }),
    ]);
  });
});
