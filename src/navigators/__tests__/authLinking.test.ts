import type { AuthSessionResult } from 'expo-auth-session';

import {
  completeAuthWithCallbackUrl,
  isAuthCallbackUrl,
} from '@app/navigators/authLinking';

describe('authLinking magic-link sign in', () => {
  /**
   * The magic link App Review uses: an obscure proxy URL redirects into the app
   * with a stored test-account token, bypassing the OAuth/2FA flow. The proxy
   * hands the app exactly this foam://auth deep link.
   */
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
      async (_response: AuthSessionResult | null) => null,
    );

    const handled = await completeAuthWithCallbackUrl(
      magicUrl,
      loginWithTwitch,
    );

    expect(handled).toBe(true);
    expect(loginWithTwitch).toHaveBeenCalledTimes(1);

    const response = loginWithTwitch.mock.calls[0]?.[0] ?? null;
    if (response?.type !== 'success') {
      throw new Error('expected a successful auth session result');
    }

    expect(response.authentication?.accessToken).toBe('magic-access-token');
    expect(response.params.refresh_token).toBe('magic-refresh-token');
  });
});
