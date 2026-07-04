import {
  parseTwitchUrl,
  type TwitchLink,
  twitchLinkToAppPath,
} from '../twitchLinking';

describe('parseTwitchUrl', () => {
  test('parses Twitch clip URLs', () => {
    expect(
      parseTwitchUrl('https://clips.twitch.tv/CoolClipSlug'),
    ).toEqual<TwitchLink>({
      type: 'clip',
      clipId: 'CoolClipSlug',
    });
    expect(
      parseTwitchUrl('https://www.twitch.tv/cohhcarnage/clip/CoolClipSlug'),
    ).toEqual<TwitchLink>({
      type: 'clip',
      channelLogin: 'cohhcarnage',
      clipId: 'CoolClipSlug',
    });
    expect(
      parseTwitchUrl('https://www.twitch.tv/clip/CoolClipSlug'),
    ).toEqual<TwitchLink>({
      type: 'clip',
      clipId: 'CoolClipSlug',
    });
  });

  test('still parses channels and VODs', () => {
    expect(
      parseTwitchUrl('https://www.twitch.tv/cohhcarnage'),
    ).toEqual<TwitchLink>({
      type: 'channel',
      channelLogin: 'cohhcarnage',
    });
    expect(
      parseTwitchUrl('https://www.twitch.tv/videos/123'),
    ).toEqual<TwitchLink>({
      type: 'vod',
      videoId: '123',
    });
  });

  test('parses a channel /about URL as a profile link', () => {
    expect(
      parseTwitchUrl('https://www.twitch.tv/cohhcarnage/about'),
    ).toEqual<TwitchLink>({
      type: 'profile',
      channelLogin: 'cohhcarnage',
    });
  });

  test('does not treat reserved directory paths as channels', () => {
    expect(
      parseTwitchUrl('https://www.twitch.tv/directory/category/Just_Chatting'),
    ).toBeNull();
  });
});

describe('twitchLinkToAppPath', () => {
  test('maps channels and VOD-style channel videos to the live stream screen', () => {
    expect(
      twitchLinkToAppPath({ type: 'channel', channelLogin: 'cohhcarnage' }),
    ).toBe('/streams/live-stream/cohhcarnage');
    expect(
      twitchLinkToAppPath({
        type: 'video',
        channelLogin: 'cohhcarnage',
        videoId: '123',
      }),
    ).toBe('/streams/live-stream/cohhcarnage');
  });

  test('maps profile links to the streamer profile screen', () => {
    expect(
      twitchLinkToAppPath({ type: 'profile', channelLogin: 'cohhcarnage' }),
    ).toBe('/streams/streamer-profile/cohhcarnage');
  });

  test('maps clips to the clip screen', () => {
    expect(twitchLinkToAppPath({ type: 'clip', clipId: 'CoolClipSlug' })).toBe(
      '/streams/clip/CoolClipSlug',
    );
  });

  test('returns null for links with no dedicated screen', () => {
    expect(twitchLinkToAppPath({ type: 'vod', videoId: '123' })).toBeNull();
    expect(twitchLinkToAppPath(null)).toBeNull();
  });
});
