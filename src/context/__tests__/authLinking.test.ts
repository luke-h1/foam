import type { AuthSessionResult } from 'expo-auth-session';

import type { LoginWithTwitchResult } from '@app/context/auth-context-value';
import {
  completeAuthWithCallbackUrl,
  isAuthCallbackUrl,
} from '@app/context/authLinking';

describe('authLinking magic-link sign in', () => {
  const magicUrl =
    'foam://auth?access_token=magic-access-token&refresh_token=magic-refresh-token&token_type=bearer&expires_in=14400';

  test('recognises a magic-link callback URL that carries a token', () => {
    expect(isAuthCallbackUrl(magicUrl)).toBe(true);
  });

  test('does not treat a tokenless callback URL as a sign in', () => {
    expect(isAuthCallbackUrl('foam://auth')).toBe(false);
  });

  test('recognises a variant-scheme callback URL (non-prod builds)', () => {
    expect(
      isAuthCallbackUrl(
        'foam-internal://auth?access_token=magic-access-token&token_type=bearer',
      ),
    ).toBe(true);

    expect(
      isAuthCallbackUrl(
        'foam-dev://auth?access_token=magic-access-token&token_type=bearer',
      ),
    ).toBe(true);
  });

  test('completes login from a magic-link URL and forwards the refresh token', async () => {
    const loginWithTwitch = jest.fn(
      async (
        _response: AuthSessionResult | null,
      ): Promise<LoginWithTwitchResult> => ({ ok: true }),
    );

    const result = await completeAuthWithCallbackUrl(magicUrl, loginWithTwitch);

    expect(result).toEqual<LoginWithTwitchResult>({ ok: true });

    expect(loginWithTwitch).toHaveBeenCalledTimes(1);

    const response = loginWithTwitch.mock.calls[0]?.[0] ?? null;

    if (response?.type !== 'success') {
      throw new Error('expected a successful auth session result');
    }

    expect(response.authentication?.accessToken).toBe('magic-access-token');

    expect(response.params['refresh_token']).toBe('magic-refresh-token');
  });
});

describe('authLinking native callback host restriction', () => {
  const tokenQuery =
    'access_token=injected-token&token_type=bearer&expires_in=14400';

  test('accepts foam-app.com auth and proxy callbacks that carry a token', () => {
    expect(isAuthCallbackUrl(`https://foam-app.com/auth?${tokenQuery}`)).toBe(
      true,
    );

    expect(
      isAuthCallbackUrl(
        `https://auth-staging.foam-app.com/proxy?${tokenQuery}`,
      ),
    ).toBe(true);
  });

  test('rejects a token-bearing https /auth link from any other host', () => {
    expect(isAuthCallbackUrl(`https://twitch.tv/auth?${tokenQuery}`)).toBe(
      false,
    );

    expect(isAuthCallbackUrl(`https://evil.example/auth?${tokenQuery}`)).toBe(
      false,
    );
  });

  test('returns an error result without calling login for a URL with no token', async () => {
    const loginWithTwitch = jest.fn(
      async (): Promise<LoginWithTwitchResult> => ({ ok: true }),
    );

    const result = await completeAuthWithCallbackUrl(
      'foam://auth',
      loginWithTwitch,
    );

    expect(result).toEqual<LoginWithTwitchResult>({
      ok: false,
      reason: 'error',
    });

    expect(loginWithTwitch).not.toHaveBeenCalled();
  });
});
