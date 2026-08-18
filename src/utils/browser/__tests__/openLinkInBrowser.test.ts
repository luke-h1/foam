import { AppState, type AppStateStatus, Linking } from 'react-native';

import * as WebBrowser from 'expo-web-browser';

import { openLinkInBrowserAsync } from '../openLinkInBrowser';

describe('openLinkInBrowserAsync', () => {
  let handleAppStateChange: ((state: AppStateStatus) => void) | undefined;
  const removeAppStateListener = jest.fn();
  let openBrowserAsync: jest.SpiedFunction<typeof WebBrowser.openBrowserAsync>;

  beforeEach(() => {
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        handleAppStateChange = listener;
        return { remove: removeAppStateListener };
      });
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    openBrowserAsync = jest.spyOn(WebBrowser, 'openBrowserAsync');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('resolves when the in-app browser closes', async () => {
    openBrowserAsync.mockResolvedValue({
      type: WebBrowser.WebBrowserResultType.DISMISS,
    });

    await expect(
      openLinkInBrowserAsync('https://example.com'),
    ).resolves.toEqual(undefined);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  test('waits for the app to return after opening an external URL', async () => {
    openBrowserAsync.mockRejectedValue(new Error('Unsupported URL scheme'));

    const result = openLinkInBrowserAsync('itms-beta://');
    let resolved = false;
    void result.then(() => {
      resolved = true;
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(Linking.openURL).toHaveBeenCalledWith('itms-beta://');
    expect(resolved).toEqual(false);

    handleAppStateChange?.('inactive');
    handleAppStateChange?.('active');

    await expect(result).resolves.toEqual(undefined);
    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
  });
});
