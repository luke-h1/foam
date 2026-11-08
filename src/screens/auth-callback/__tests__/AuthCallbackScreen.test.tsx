import { render, waitFor } from '@testing-library/react-native';
import { useLinkingURL } from 'expo-linking';
import { router } from 'expo-router';

import { createAuthContextValue } from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import {
  AuthContextTestProvider,
  type LoginWithTwitchResult,
} from '@app/context/AuthContext';

import { AuthCallbackScreen } from '../AuthCallbackScreen';

jest.mock('expo-linking', () => ({
  useLinkingURL: jest.fn(),
}));

const magicUrl =
  'foam://auth?access_token=magic-access-token&token_type=bearer&expires_in=14400';

function renderScreen(result: LoginWithTwitchResult) {
  const loginWithTwitch = jest.fn(async () => result);

  render(
    <AuthContextTestProvider {...createAuthContextValue({ loginWithTwitch })}>
      <AuthCallbackScreen />
    </AuthContextTestProvider>,
  );

  return loginWithTwitch;
}

describe('AuthCallbackScreen', () => {
  test('leaves to Top when the URL has no token', async () => {
    jest.mocked(useLinkingURL).mockReturnValue('foam://auth');

    const loginWithTwitch = renderScreen({ ok: true });

    await waitFor(() =>
      expect(jest.mocked(router.replace).mock.calls).toEqual([['/tabs/top']]),
    );

    expect(loginWithTwitch).not.toHaveBeenCalled();
  });

  test('leaves to Top when the token exchange fails', async () => {
    jest.mocked(useLinkingURL).mockReturnValue(magicUrl);

    const loginWithTwitch = renderScreen({ ok: false, reason: 'error' });

    await waitFor(() =>
      expect(jest.mocked(router.replace).mock.calls).toEqual([['/tabs/top']]),
    );

    expect(loginWithTwitch).toHaveBeenCalledTimes(1);
  });

  test('stays put on success so usePopulateAuth owns the navigation', async () => {
    jest.mocked(useLinkingURL).mockReturnValue(magicUrl);

    const loginWithTwitch = renderScreen({ ok: true });

    await waitFor(() => expect(loginWithTwitch).toHaveBeenCalledTimes(1));

    expect(router.replace).not.toHaveBeenCalled();
  });
});
