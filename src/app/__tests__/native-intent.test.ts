import * as authLinking from '@app/navigators/authLinking';

import { redirectSystemPath } from '../+native-intent';

describe('redirectSystemPath', () => {
  let mockIsAuthCallbackUrl: jest.SpyInstance<boolean, [string | null]>;

  beforeEach(() => {
    mockIsAuthCallbackUrl = jest
      .spyOn(authLinking, 'isAuthCallbackUrl')
      .mockReturnValue(false);
  });

  afterEach(() => {
    mockIsAuthCallbackUrl.mockRestore();
  });

  test('passes auth callback URLs through untouched', () => {
    mockIsAuthCallbackUrl.mockReturnValue(true);
    const url = 'foam://auth#access_token=abc&token_type=bearer';

    expect(redirectSystemPath({ path: url, initial: true })).toBe(url);
  });

  test('passes Twitch URLs through without rewriting', () => {
    expect(
      redirectSystemPath({
        path: 'https://www.twitch.tv/cohhcarnage',
        initial: true,
      }),
    ).toBe('https://www.twitch.tv/cohhcarnage');
  });

  test('leaves app paths unchanged', () => {
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
