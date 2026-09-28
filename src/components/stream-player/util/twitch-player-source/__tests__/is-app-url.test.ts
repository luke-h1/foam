import { isAppUrl } from '../is-app-url';
import { isTwitchPassportCallbackUrl } from '../is-twitch-passport-callback-url';

describe('isAppUrl', () => {
  test('detects app and Twitch passport callback URLs', () => {
    expect(isAppUrl('foam://stream/cohhcarnage')).toBe(true);
    expect(isAppUrl('exp+foam://stream/cohhcarnage')).toBe(true);
    expect(isAppUrl('https://www.twitch.tv')).toBe(false);

    expect(
      isTwitchPassportCallbackUrl(
        'https://www.twitch.tv/passport-callback#token=abc',
      ),
    ).toBe(true);

    expect(isTwitchPassportCallbackUrl('not a url')).toBe(false);
  });
});
