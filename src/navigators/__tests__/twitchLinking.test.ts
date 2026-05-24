import { parseTwitchUrl } from '../twitchLinking';

describe('parseTwitchUrl', () => {
  test('parses Twitch clip URLs', () => {
    expect(parseTwitchUrl('https://clips.twitch.tv/CoolClipSlug')).toEqual({
      type: 'clip',
      clipId: 'CoolClipSlug',
    });
    expect(
      parseTwitchUrl('https://www.twitch.tv/cohhcarnage/clip/CoolClipSlug'),
    ).toEqual({
      type: 'clip',
      channelLogin: 'cohhcarnage',
      clipId: 'CoolClipSlug',
    });
    expect(parseTwitchUrl('https://www.twitch.tv/clip/CoolClipSlug')).toEqual({
      type: 'clip',
      clipId: 'CoolClipSlug',
    });
  });

  test('still parses channels and VODs', () => {
    expect(parseTwitchUrl('https://www.twitch.tv/cohhcarnage')).toEqual({
      type: 'channel',
      channelLogin: 'cohhcarnage',
    });
    expect(parseTwitchUrl('https://www.twitch.tv/videos/123')).toEqual({
      type: 'vod',
      videoId: '123',
    });
  });
});
