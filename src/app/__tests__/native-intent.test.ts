import { redirectSystemPath } from '../+native-intent';

describe('redirectSystemPath', () => {
  test.each([
    {
      name: 'an auth callback URL',
      path: 'foam://auth#access_token=abc&token_type=bearer',
      initial: true,
    },
    {
      name: 'a Twitch URL',
      path: 'https://www.twitch.tv/cohhcarnage',
      initial: true,
    },
    {
      name: 'an app path',
      path: '/streams/live-stream/xqc',
      initial: false,
    },
    { name: 'malformed input', path: 'not a url', initial: false },
  ])('returns $name unchanged', ({ path, initial }) => {
    expect(redirectSystemPath({ path, initial })).toBe(path);
  });
});
