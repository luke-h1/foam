import { isAuthCallbackUrl } from '@app/navigators/authLinking';
import { redirectSystemPath } from '../+native-intent';

jest.mock('@app/navigators/authLinking', () => ({
  isAuthCallbackUrl: jest.fn(() => false),
}));

const mockIsAuthCallbackUrl = jest.mocked(isAuthCallbackUrl);

describe('redirectSystemPath', () => {
  beforeEach(() => {
    mockIsAuthCallbackUrl.mockReturnValue(false);
  });

  test('routes a Twitch channel URL to the live stream screen', () => {
    expect(
      redirectSystemPath({
        path: 'https://www.twitch.tv/cohhcarnage',
        initial: true,
      }),
    ).toBe('/streams/live-stream/cohhcarnage');
  });

  test('routes a Twitch clip URL to the clip screen', () => {
    expect(
      redirectSystemPath({
        path: 'https://clips.twitch.tv/CoolClipSlug',
        initial: false,
      }),
    ).toBe('/streams/clip/CoolClipSlug');
  });

  test('routes a channel /about URL to the streamer profile screen', () => {
    expect(
      redirectSystemPath({
        path: 'https://www.twitch.tv/cohhcarnage/about',
        initial: false,
      }),
    ).toBe('/streams/streamer-profile/cohhcarnage');
  });

  test('passes auth callback URLs through untouched', () => {
    mockIsAuthCallbackUrl.mockReturnValue(true);
    const url = 'foam://auth#access_token=abc&token_type=bearer';

    expect(redirectSystemPath({ path: url, initial: true })).toBe(url);
  });

  test('leaves app-scheme paths it does not recognise unchanged', () => {
    expect(
      redirectSystemPath({
        path: '/streams/live-stream/xqc',
        initial: false,
      }),
    ).toBe('/streams/live-stream/xqc');
  });

  test('does not throw on malformed input', () => {
    expect(redirectSystemPath({ path: 'not a url', initial: false })).toBe(
      'not a url',
    );
  });
});
