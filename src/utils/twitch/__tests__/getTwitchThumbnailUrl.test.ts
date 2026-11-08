import { getTwitchThumbnailUrl } from '../getTwitchThumbnailUrl';

describe('getTwitchThumbnailUrl', () => {
  test('fills a live preview template', () => {
    expect(
      getTwitchThumbnailUrl(
        'https://static-cdn.jtvnw.net/previews-ttv/live_user_x-{width}x{height}.jpg',
        { width: 860, height: 484 },
      ),
    ).toBe('https://static-cdn.jtvnw.net/previews-ttv/live_user_x-860x484.jpg');
  });

  test('fills a VOD template that uses %{width}', () => {
    expect(
      getTwitchThumbnailUrl('https://vod/thumb-%{width}x%{height}.jpg', {
        width: 640,
        height: 360,
      }),
    ).toBe('https://vod/thumb-640x360.jpg');
  });
});
