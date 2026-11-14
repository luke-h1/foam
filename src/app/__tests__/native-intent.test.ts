import { redirectSystemPath } from '../+native-intent';

function redirect(path: string) {
  return redirectSystemPath({ path, initial: false });
}

test('maps a twitch channel link to the live stream route', () => {
  expect(redirect('https://twitch.tv/xqc')).toBe('/streams/live-stream/xqc');

  expect(redirect('https://www.twitch.tv/Lirik')).toBe(
    '/streams/live-stream/lirik',
  );

  expect(redirect('https://m.twitch.tv/pokimane/')).toBe(
    '/streams/live-stream/pokimane',
  );
});

test('maps a twitch vod link to the vod route', () => {
  expect(redirect('https://www.twitch.tv/videos/2301774421')).toBe(
    '/streams/vod/2301774421',
  );
});

test('sends reserved and unroutable twitch paths home', () => {
  expect(redirect('https://twitch.tv/directory')).toBe('/');

  expect(redirect('https://twitch.tv/directory/category/just-chatting')).toBe(
    '/',
  );

  expect(redirect('https://twitch.tv/settings/profile')).toBe('/');

  expect(redirect('https://twitch.tv/')).toBe('/');

  expect(redirect('https://twitch.tv/a')).toBe('/');
});

test('leaves non-twitch urls unchanged', () => {
  expect(redirect('foam://chat?channelId=1&channelName=a')).toBe(
    'foam://chat?channelId=1&channelName=a',
  );

  expect(redirect('https://foam-app.com/streams/live-stream/xqc')).toBe(
    'https://foam-app.com/streams/live-stream/xqc',
  );

  expect(redirect('/tabs/settings')).toBe('/tabs/settings');
});
