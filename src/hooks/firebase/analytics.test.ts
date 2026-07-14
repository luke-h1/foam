import {
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperties,
} from '@react-native-firebase/analytics';

import { logger } from '@app/utils/logger';

import {
  logAnalyticsEvent,
  logAnalyticsScreenView,
  setAnalyticsEnabled,
  setAnalyticsUser,
} from './analytics';

jest.mock('@react-native-firebase/installations');
jest.mock('@react-native-firebase/app');
jest.mock('@react-native-firebase/analytics');

jest.mock('@app/utils/logger', () => ({
  logger: {
    main: {
      warn: jest.fn(),
    },
  },
}));

const mockedSetCollectionEnabled = jest.mocked(setAnalyticsCollectionEnabled);
const mockedSetUserId = jest.mocked(setUserId);
const mockedSetUserProperties = jest.mocked(setUserProperties);
const mockedLogEvent = jest.mocked(logEvent);
const mockedLogScreenView = jest.mocked(logScreenView);
const mockedWarn = jest.mocked(logger.main.warn);

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setAnalyticsEnabled toggles collection', async () => {
    await setAnalyticsEnabled(false);

    expect(mockedSetCollectionEnabled).toHaveBeenCalledWith(
      expect.anything(),
      false,
    );
  });

  test('setAnalyticsUser sets id and twitch properties', async () => {
    await setAnalyticsUser({
      id: '123',
      twitchLogin: 'foam',
      twitchDisplayName: 'Foam',
    });

    expect(mockedSetUserId).toHaveBeenCalledWith(expect.anything(), '123');
    expect(mockedSetUserProperties).toHaveBeenCalledWith(expect.anything(), {
      twitchLogin: 'foam',
      twitchDisplayName: 'Foam',
    });
  });

  test('setAnalyticsUser nulls missing twitch properties', async () => {
    await setAnalyticsUser({ id: 'anonymous' });

    expect(mockedSetUserProperties).toHaveBeenCalledWith(expect.anything(), {
      twitchLogin: null,
      twitchDisplayName: null,
    });
  });

  test('logAnalyticsEvent forwards name and params', async () => {
    await logAnalyticsEvent('experiment_exposure', {
      experiment: 'chatComposerLayout',
      variant: 'compact',
    });

    expect(mockedLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      'experiment_exposure',
      { experiment: 'chatComposerLayout', variant: 'compact' },
    );
  });

  test('logAnalyticsScreenView reports screen name and class', async () => {
    await logAnalyticsScreenView('/streams/foam');

    expect(mockedLogScreenView).toHaveBeenCalledWith(expect.anything(), {
      screen_name: '/streams/foam',
      screen_class: '/streams/foam',
    });
  });

  test('swallows and logs SDK failures instead of throwing', async () => {
    mockedLogEvent.mockRejectedValueOnce(new Error('offline'));

    await expect(logAnalyticsEvent('boom')).resolves.toBeUndefined();
    expect(mockedWarn).toHaveBeenCalledWith(
      'Failed to log analytics event',
      expect.any(Error),
    );
  });
});
