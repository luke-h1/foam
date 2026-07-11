import { getTwitchClipIdFromUrl } from '../replaceTextWithEmotes';

describe('getTwitchClipIdFromUrl', () => {
  test('extracts clip slugs from Twitch clip URL shapes', () => {
    expect(getTwitchClipIdFromUrl('https://clips.twitch.tv/CoolClipSlug')).toBe(
      'CoolClipSlug',
    );
    expect(
      getTwitchClipIdFromUrl(
        'https://www.twitch.tv/cohhcarnage/clip/CoolClipSlug',
      ),
    ).toBe('CoolClipSlug');
    expect(
      getTwitchClipIdFromUrl('https://www.twitch.tv/clip/CoolClipSlug'),
    ).toBe('CoolClipSlug');
    expect(
      getTwitchClipIdFromUrl('https://www.clips.twitch.tv/CoolClipSlug'),
    ).toBe('CoolClipSlug');
  });

  test('returns null for non-clip URLs', () => {
    expect(getTwitchClipIdFromUrl('https://www.twitch.tv/cohhcarnage')).toBe(
      null,
    );
  });

  test('returns null when the clip URL has no slug', () => {
    expect(getTwitchClipIdFromUrl('https://clips.twitch.tv/')).toBe(null);
  });
});
