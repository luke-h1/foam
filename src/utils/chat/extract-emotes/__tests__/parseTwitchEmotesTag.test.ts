import { parseTwitchEmotesTag } from '../parseTwitchEmotesTag';

describe('extractEmotes', () => {
  test('parses Twitch IRC emote tags with multiple emotes and positions', () => {
    expect(parseTwitchEmotesTag('25:0-4,12-16/1902:6-10')).toEqual({
      '25': ['0-4', '12-16'],
      '1902': ['6-10'],
    });
  });
});
